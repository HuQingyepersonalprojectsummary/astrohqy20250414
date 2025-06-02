import { getCollection, type CollectionEntry } from 'astro:content';

interface MonthData {
  monthName: string;
  monthNumber: number; // 1 for January, 12 for December
  // count: number; // Optional: number of posts in that month
}

export interface YearData {
  year: string;
  months: MonthData[];
}

export async function getArchiveData(): Promise<YearData[]> {
  const posts = await getCollection('blog');
  if (!posts || posts.length === 0) {
    return [];
  }

  const archive: Record<string, Set<number>> = {}; // Record<year, Set<monthNumber>>

  posts.forEach((post: CollectionEntry<'blog'>) => {
    const pubDate = post.data.pubDate;
    if (pubDate instanceof Date && !isNaN(pubDate.valueOf())) {
      const year = pubDate.getUTCFullYear().toString();
      const monthNumber = pubDate.getUTCMonth() + 1; // UTC months are 0-indexed

      if (!archive[year]) {
        archive[year] = new Set();
      }
      archive[year].add(monthNumber);
    } else {
      console.warn(`Post with slug "${post.slug}" has invalid pubDate: ${post.data.pubDate}. Skipping from archive.`);
    }
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const sortedYears = Object.keys(archive).sort((a, b) => parseInt(b) - parseInt(a)); // Sort years descending

  const result: YearData[] = sortedYears.map(year => {
    const monthNumbers = Array.from(archive[year]).sort((a, b) => b - a); // Sort months descending
    const months: MonthData[] = monthNumbers.map(monthNumber => ({
      monthName: monthNames[monthNumber - 1],
      monthNumber: monthNumber,
    }));
    return { year, months };
  });

  return result;
}
