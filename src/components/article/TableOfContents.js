import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { IoListOutline } from 'react-icons/io5';
import styles from './TableOfContents.module.scss';

/**
 * Sticky "Mục lục" that highlights the section being read.
 *
 * @param {Array<{id: string, text: string, level: number}>} headings
 */
export default function TableOfContents({ headings, className }) {
  const [activeId, setActiveId] = useState(headings[0]?.id);

  useEffect(() => {
    if (headings.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const elements = headings.map(h => document.getElementById(h.id)).filter(Boolean);
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      });
      // The first heading on screen, else keep the last one we passed.
      const first = elements.find(el => visible.has(el.id));
      if (first) {
        setActiveId(first.id);
        return;
      }
      const passed = elements.filter(el => el.getBoundingClientRect().top < 0);
      if (passed.length > 0) {
        setActiveId(passed[passed.length - 1].id);
      }
    }, { rootMargin: '-72px 0px -60% 0px' });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  function handleClick(event, id) {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    event.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  }

  return (
    <nav className={clsx(styles.toc, className)} aria-label="Mục lục">
      <div className={styles.title}><IoListOutline /> Mục lục</div>
      <ol className={styles.list}>
        {headings.map(h => (
          <li key={h.id} style={{ '--level': h.level }}>
            <a
              href={`#${h.id}`}
              className={clsx(styles.link, h.id === activeId && styles.active)}
              onClick={event => handleClick(event, h.id)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
