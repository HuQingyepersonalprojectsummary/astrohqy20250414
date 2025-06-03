// 从 astro:content 导入 getCollection 和 CollectionEntry 类型，用于获取和处理博客文章集合
import { getCollection, type CollectionEntry } from 'astro:content';

// 定义月份数据的接口
interface MonthData {
  monthName: string; // 月份名称，例如 "January"
  monthNumber: number; // 月份数字，1 代表一月，12 代表十二月
  // count: number; // 可选：该月份的文章数量 (当前未实现)
}

// 定义年份数据的接口，包含年份字符串和该年份下的月份数据数组
export interface YearData {
  year: string;      // 年份字符串，例如 "2023"
  months: MonthData[]; // 该年份下的月份数据数组
}

// 异步函数，用于获取并处理博客文章数据，生成归档列表所需的数据结构
export async function getArchiveData(): Promise<YearData[]> {
  // 获取所有 'blog' 集合中的文章
  const posts = await getCollection('blog');
  // 如果没有文章或文章列表为空，则返回空数组
  if (!posts || posts.length === 0) {
    return [];
  }

  // 初始化一个对象用于存储归档数据，键为年份字符串，值为包含月份数字的 Set 集合
  // 使用 Set 可以确保每个年份下的月份不重复
  const archive: Record<string, Set<number>> = {}; // 例如: { "2023": Set {1, 2, 12} }

  // 遍历所有文章
  posts.forEach((post: CollectionEntry<'blog'>) => {
    const pubDate = post.data.pubDate; // 获取文章的发布日期

    // 检查发布日期是否为有效的 Date 对象
    if (pubDate instanceof Date && !isNaN(pubDate.valueOf())) {
      const year = pubDate.getUTCFullYear().toString(); // 获取 UTC 年份并转换为字符串
      const monthNumber = pubDate.getUTCMonth() + 1;   // 获取 UTC 月份 (0-11)，加 1 转换为 1-12

      // 如果该年份在 archive 对象中还不存在，则为其初始化一个空的 Set
      if (!archive[year]) {
        archive[year] = new Set();
      }
      // 将当前文章的月份添加到对应年份的 Set 中
      archive[year].add(monthNumber);
    } else {
      // 如果日期无效，则在控制台输出警告，并跳过此文章
      console.warn(`文章 "${post.slug}" 的发布日期 (pubDate) 无效: ${post.data.pubDate}。已从归档中跳过。`);
    }
  });

  // 定义月份名称数组，用于将月份数字转换为月份名称
  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ]; // 使用中文月份名称

  // 获取 archive 对象中的所有年份键（即所有有文章的年份），并按降序排序
  const sortedYears = Object.keys(archive).sort((a, b) => parseInt(b) - parseInt(a));

  // 遍历排序后的年份，构建最终的 YearData 数组
  const result: YearData[] = sortedYears.map(year => {
    // 从 Set 中获取该年份下的所有月份数字，并按升序排序
    const monthNumbers = Array.from(archive[year]).sort((a, b) => a - b);
    // 将月份数字映射为 MonthData 对象数组
    const months: MonthData[] = monthNumbers.map(monthNumber => ({
      monthName: monthNames[monthNumber - 1], // 从 monthNames 数组中获取月份名称
      monthNumber: monthNumber,
    }));
    // 返回包含年份和对应月份数据的 YearData 对象
    return { year, months };
  });

  // 返回处理好的归档数据
  return result;
}
