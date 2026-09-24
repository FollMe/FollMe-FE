import { forwardRef } from 'react';
import clsx from 'clsx';
import Tooltip from '@mui/material/Tooltip';
import { RULE_LABELS } from 'util/fortune';
import styles from './TuViChart.module.scss';

// Grid position (row, column) of each branch on the standard 4×4 chart.
const POSITIONS = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

const TRANSFORM_SHORT = { loc: 'Lộc', quyen: 'Quyền', khoa: 'Khoa', ky: 'Kỵ' };

function StarLabel({ star }) {
  const tooltip = (
    <div>
      <strong>{star.name}</strong>
      {star.brightnessName && <> · {star.brightnessName}</>}
      {star.transformName && <> · {star.transformName}</>}
      <div>{RULE_LABELS[star.ruleId] ?? star.ruleId}</div>
    </div>
  );
  return (
    <Tooltip title={tooltip} arrow enterTouchDelay={0}>
      <span className={clsx(styles.star, styles[`kind_${star.kind}`], star.brightness && styles[`b${star.brightness}`])}>
        {star.name}
        {star.brightness && <sup className={styles.brightness}>{star.brightness === 'D' ? 'Đ' : star.brightness}</sup>}
        {star.transform && <span className={clsx(styles.transform, styles[star.transform])}>{TRANSFORM_SHORT[star.transform]}</span>}
      </span>
    </Tooltip>
  );
}

function Palace({ palace, isMenh }) {
  const [row, col] = POSITIONS[palace.branch];
  const main = palace.stars.filter(s => s.kind === 'main');
  const good = palace.stars.filter(s => s.kind === 'good');
  const bad = palace.stars.filter(s => s.kind === 'bad');
  const ring = palace.stars.filter(s => s.kind === 'ring');

  return (
    <div
      className={clsx(styles.palace, col === 4 && styles.lastCol, row === 4 && styles.lastRow, isMenh && styles.menh, palace.tieuHan && styles.tieuHan)}
      style={{ gridRow: row, gridColumn: col }}
    >
      <div className={styles.palaceHead}>
        <span className={styles.canChi}>{palace.stemName} {palace.branchName}</span>
        <span className={styles.palaceName}>
          {palace.name}
          {palace.isThan && <span className={styles.than}>Thân</span>}
        </span>
        <span className={styles.daiHan}>{palace.daiHan}</span>
      </div>
      <div className={styles.mainStars}>
        {main.length > 0 ? main.map(s => <StarLabel key={s.id} star={s} />) : <span className={styles.vcd}>Vô chính diệu</span>}
      </div>
      <div className={styles.minor}>
        <div>{good.map(s => <StarLabel key={s.id} star={s} />)}</div>
        <div>{bad.map(s => <StarLabel key={s.id} star={s} />)}</div>
      </div>
      <div className={styles.ring}>{ring.map(s => s.name).join(' · ')}</div>
      <div className={styles.markers}>
        {palace.tuan && <span className={styles.marker}>Tuần</span>}
        {palace.triet && <span className={styles.marker}>Triệt</span>}
        {palace.tieuHan && <span className={clsx(styles.marker, styles.markerHan)}>Tiểu hạn</span>}
      </div>
    </div>
  );
}

/** A tử vi chart (lá số) in the traditional 4×4 layout. */
const TuViChart = forwardRef(function TuViChart({ chart, name }, ref) {
  const lunar = chart.lunar;
  return (
    <div className={styles.scroller}>
      <div ref={ref} className={styles.chart}>
        {chart.palaces.map(p => <Palace key={p.branch} palace={p} isMenh={p.branch === chart.menhBranch} />)}
        <div className={styles.center}>
          <div className={styles.centerTitle}>Lá số tử vi</div>
          {name && <div className={styles.centerName}>{name}</div>}
          <dl className={styles.info}>
            <dt>Năm</dt><dd>{chart.yearName}</dd>
            <dt>Tháng</dt><dd>{chart.monthName}</dd>
            <dt>Ngày</dt><dd>{chart.dayName}</dd>
            <dt>Giờ</dt><dd>{chart.hourName}</dd>
            <dt>Âm lịch</dt><dd>{lunar.day}/{lunar.month}{lunar.isLeapMonth ? ' (nhuận)' : ''}/{lunar.year}</dd>
            <dt>Âm dương</dt><dd>{chart.yinYang}</dd>
            <dt>Bản mệnh</dt><dd>{chart.banMenh}</dd>
            <dt>Cục</dt><dd>{chart.cuc.name}</dd>
            <dt>Mệnh chủ</dt><dd>{chart.menhChu}</dd>
            <dt>Thân chủ</dt><dd>{chart.thanChu}</dd>
          </dl>
          <div className={styles.relation}>{chart.menhCucRelation.name}</div>
          <div className={styles.brand}>follme · tử vi</div>
        </div>
      </div>
    </div>
  );
});

export default TuViChart;
