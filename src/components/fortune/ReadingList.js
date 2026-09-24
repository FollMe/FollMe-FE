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
          {section.items.map(item => (
            <article key={item.id} className={styles.item}>
              <div className={styles.itemHead}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <WhyTooltip ruleIds={item.sourceRuleIds} />
              </div>
              <p className={styles.itemText}>{item.text}</p>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
