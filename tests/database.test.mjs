import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const read = async path => (await readFile(new URL('../' + path, import.meta.url), 'utf8'))
  .replace(/^CREATE EXTENSION[^;]*;/gm, '');
const migration = await read('database/migrations/2026090801_comments.sql');
async function database() {
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}', created_at timestamptz DEFAULT now());
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;`);
  return db;
}
async function asUser(db, id, sql) {
  await db.exec(`SET ROLE ${id ? 'authenticated' : 'anon'};
    SELECT set_config('request.jwt.claim.sub', '${id || ''}', false);`);
  try { return await db.query(sql); } finally { await db.exec('RESET ROLE'); }
}
async function users(db) {
  await db.exec(`INSERT INTO auth.users(id,email) VALUES ('${a}','same@a.test'), ('${b}','same@b.test')`);
}

test('fresh database: field permissions, private likes, edits, counts, persistent floors and rerun', async t => {
  const db = await database(); t.after(() => db.close());
  await db.exec(migration); await users(db);
  const [{ id, updated_at }] = (await asUser(db, a, `INSERT INTO comments(post_slug,user_id,content)
    VALUES ('post','${a}','original') RETURNING id,updated_at::text`)).rows;
  for (const sql of [
    `INSERT INTO comments(post_slug,user_id,content,likes_count) VALUES ('p','${a}','fake',99)`,
    `UPDATE comments SET likes_count=99 WHERE id='${id}'`,
    `INSERT INTO comment_edit_history(comment_id,old_content,edited_by) VALUES ('${id}','fake','${a}')`
  ]) await assert.rejects(asUser(db, a, sql), { code: '42501' });
  for (const sql of ['SELECT ip_address FROM comments', 'SELECT original_content FROM comments',
    'SELECT * FROM comment_edit_history', 'SELECT * FROM comment_likes']) {
    await assert.rejects(asUser(db, null, sql), { code: '42501' });
  }
  await asUser(db, b, `INSERT INTO comment_likes(comment_id,user_id) VALUES ('${id}','${b}')`);
  assert.equal((await db.query('SELECT likes_count FROM comments')).rows[0].likes_count, 1);
  assert.equal((await asUser(db, a, 'SELECT * FROM comment_likes')).rows.length, 0);
  assert.equal((await asUser(db, b, 'SELECT * FROM comment_likes')).rows.length, 1);
  await asUser(db, b, `DELETE FROM comment_likes WHERE comment_id='${id}'`);
  assert.equal((await db.query('SELECT likes_count FROM comments')).rows[0].likes_count, 0);
  assert.equal((await asUser(db, b, `UPDATE comments SET content='wrong author' WHERE id='${id}' RETURNING id`)).rows.length, 0);
  assert.equal((await asUser(db, a, `UPDATE comments SET content='edited' WHERE id='${id}' AND updated_at='${updated_at}' RETURNING id`)).rows.length, 1);
  assert.equal((await asUser(db, a, `UPDATE comments SET content='stale' WHERE id='${id}' AND updated_at='${updated_at}' RETURNING id`)).rows.length, 0);
  await assert.rejects(asUser(db, a, `UPDATE comments SET content='' WHERE id='${id}'`), { code: '23514' });
  assert.deepEqual((await db.query('SELECT old_content FROM comment_edit_history')).rows, [{ old_content: 'original' }]);
  assert.equal((await asUser(db, b, 'SELECT * FROM comment_edit_history')).rows.length, 0);
  const second = (await asUser(db, a, `INSERT INTO comments(post_slug,user_id,content) VALUES ('post','${a}','second') RETURNING id`)).rows[0];
  await asUser(db, a, `DELETE FROM comments WHERE id='${second.id}'`);
  assert.equal((await asUser(db, a, `INSERT INTO comments(post_slug,user_id,content) VALUES ('post','${a}','third') RETURNING floor_number`)).rows[0].floor_number, 3);
  await db.exec(`BEGIN; SELECT set_config('app.internal_likes_update','true',true); UPDATE comments SET likes_count=99; COMMIT;`);
  await db.exec(migration);
  assert.deepEqual((await db.query('SELECT floor_number,likes_count FROM comments ORDER BY floor_number')).rows,
    [{ floor_number: 1, likes_count: 0 }, { floor_number: 3, likes_count: 0 }]);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM app_private.migrations')).rows[0].n, 1);
});

test('old database: retain edited profiles and repair duplicate/null floors before protection', async t => {
  const db = await database(); t.after(() => db.close());
  await db.exec(await read('database/legacy/supabase-setup.sql.disabled')); await users(db);
  await db.exec(await read('database/legacy/supabase-upgrade-comments.sql.disabled'));
  await db.exec(`UPDATE astrohqy20250414 SET username='chosen_name', avatar_url='https://example.test/avatar.png',
    full_name='Custom name',website='https://example.test',bio='Custom bio' WHERE id='${a}';
    INSERT INTO comments(post_slug,user_id,content) VALUES ('p','${a}','one'),('p','${b}','two'),('p','${a}','three');
    UPDATE comments SET floor_number=8;
    UPDATE comments SET floor_number=NULL WHERE content='three';
    CREATE FUNCTION protect_comment_immutable_fields() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN NEW.floor_number:=OLD.floor_number; NEW.likes_count:=OLD.likes_count; RETURN NEW; END; $$;
    CREATE TRIGGER renamed_protector BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION protect_comment_immutable_fields();`);
  await db.exec(migration);
  assert.deepEqual((await db.query(`SELECT username,avatar_url,bio FROM profiles WHERE id='${a}'`)).rows,
    [{ username: 'chosen_name', avatar_url: 'https://example.test/avatar.png', bio: 'Custom bio' }]);
  assert.deepEqual((await db.query('SELECT floor_number FROM comments ORDER BY floor_number')).rows.map(r => r.floor_number), [8, 9, 10]);
  await asUser(db, a, `UPDATE profiles SET username='new choice',bio='new bio' WHERE id='${a}'`);
  await db.exec(migration);
  assert.equal((await db.query(`SELECT bio FROM profiles WHERE id='${a}'`)).rows[0].bio, 'new bio');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM astrohqy20250414')).rows[0].n, 2);
});

test('username fallback retries occupied candidates instead of aborting the migration or registration', async t => {
  const db = await database(); t.after(() => db.close());
  await db.exec(`INSERT INTO auth.users(id,email,raw_user_meta_data,created_at) VALUES
    ('33333333-3333-4333-8333-333333333333','x@a.test','{"username":"same"}','2020-01-01'),
    ('44444444-4444-4444-8444-444444444444','y@a.test','{"username":"same_${a}_1"}','2020-01-02'),
    ('${a}','same@a.test','{}','2020-01-03');`);
  await db.exec(migration);
  assert.equal((await db.query(`SELECT username FROM profiles WHERE id='${a}'`)).rows[0].username, `same_${a}_2`);
  await db.exec(`INSERT INTO auth.users(id,email) VALUES ('${b}','same@b.test')`);
  assert.equal((await db.query('SELECT count(DISTINCT username)::int AS n FROM profiles')).rows[0].n, 4);
});

test('retired SQL entry points fail before changing database state', async t => {
  const db = await database(); t.after(() => db.close());
  for (const file of ['supabase-setup.sql', 'supabase-setup-profiles.sql', 'supabase-setup-custom.sql', 'supabase-upgrade-comments.sql']) {
    await assert.rejects(db.exec(await read(file)), /旧数据库脚本已停用/);
  }
  assert.equal((await db.query("SELECT to_regclass('public.comments') AS table_name")).rows[0].table_name, null);
});
