import clsx from 'clsx';
import Tooltip from '@mui/material/Tooltip';
import { IoHelpCircleOutline } from 'react-icons/io5';
import { RULE_LABELS } from 'util/fortune';
import styles from './ReadingList.module.scss';

const SECTION_TITLES = {
  overview: 'Tổng quan',
  core: 'Các con số cốt lõi',
  name: 'Con số từ họ tên',
  chart: 'Biểu đồ ngày sinh',
  palace: 'Các cung quan trọng',
  tu_hoa: 'Tứ Hóa',
  timing: 'Thời vận',
};

function WhyTooltip({ ruleIds }) {
  const lines = ruleIds.map(id => RULE_LABELS[id] ?? id);
  return (
    <Tooltip
      arrow
      enterTouchDelay={0}
      title={
        <div>
          <strong>Vì sao?</strong>
          <ul className={styles.ruleList}>
            {lines.map(line => <li key={line}>{line}</li>)}
          </ul>
        </div>
      }
    >
      <button type="button" className={styles.why} aria-label="Vì sao có luận giải này?">
        <IoHelpCircleOutline />
      </button>
    </Tooltip>
  );
}

function ReadingDetail({ detail }) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailLabel}>{detail.label}</div>
      {detail.items?.length > 0 ? (
        <ul className={styles.detailList}>
          {detail.items.map(line => <li key={line}>{line}</li>)}
        </ul>
      ) : (
        <p className={styles.detailText}>{detail.text}</p>
      )}
    </div>
  );
}

function ReadingItem({ item }) {
  const isFeatured = Boolean(item.details?.length);
  return (
    <article className={clsx(styles.item, isFeatured && styles.featured)}>
      <div className={styles.itemHead}>
        <div>
          <h3 className={styles.itemTitle}>{item.title}</h3>
          {item.tagline && <div className={styles.tagline}>{item.tagline}</div>}
          {item.hint && <div className={styles.hint}>{item.hint}</div>}
        </div>
        <WhyTooltip ruleIds={item.sourceRuleIds} />
      </div>
      <p className={styles.itemText}>{item.text}</p>
      {isFeatured && (
        <div className={styles.details}>
          {item.details.map(detail => <ReadingDetail key={detail.label} detail={detail} />)}
        </div>
      )}
      {item.shareLine && <blockquote className={styles.shareLine}>{item.shareLine}</blockquote>}
    </article>
  );
}

/** Readings grouped by section, each with a "why?" tooltip naming its rules. */
export default function ReadingList({ readings = [] }) {
  const sections = [];
  readings.forEach(reading => {
    let section = sections.find(s => s.id === reading.section);
    if (!section) {
      section = { id: reading.section, items: [] };
      sections.push(section);
    }
    section.items.push(reading);
  });

  return (
    <div className={styles.list}>
      {sections.map(section => (
        <section key={section.id} className={styles.section}>
          <h2 className={styles.sectionTitle}>{SECTION_TITLES[section.id] ?? section.id}</h2>
          {section.items.map(item => <ReadingItem key={item.id} item={item} />)}
        </section>
      ))}
    </div>
  );
}
