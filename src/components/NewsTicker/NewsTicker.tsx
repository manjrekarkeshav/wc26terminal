/* Static placeholder news items — replace with ESPN /news feed in v2 */
const NEWS_ITEMS = [
  { src: 'ESPN · News', headline: 'Round of 32 kicks off as group stage concludes', age: '1h ago' },
  { src: 'BBC Sport', headline: 'Argentina top Group J; Austria pip Algeria on goal difference', age: '2h ago' },
  { src: 'Reuters', headline: 'Spain cruise through Group H with seven goals scored', age: '3h ago' },
  { src: 'ESPN · News', headline: 'Best-third permutations: who still controls their fate', age: '4h ago' },
  { src: 'The Athletic', headline: 'Host-city guide: what to know before the Round of 32', age: '5h ago' },
];

export function NewsTicker() {
  const doubled = [...NEWS_ITEMS, ...NEWS_ITEMS];

  return (
    <section className="newsbar" id="news" aria-label="Latest news">
      <div className="news-track">
        {doubled.map((item, i) => (
          <article className="newscard" key={i}>
            <span className="src">{item.src}</span>
            <span className="hl">{item.headline}</span>
            <span className="tm">{item.age}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
