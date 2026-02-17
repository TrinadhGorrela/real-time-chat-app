import styles from "./DateHeader.module.css";

const DateHeader = ({ date }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let label;
  if (msgDay.getTime() === today.getTime()) {
    label = "Today";
  } else if (msgDay.getTime() === today.getTime() - 86400000) {
    label = "Yesterday";
  } else {
    label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className={styles.dateHeaderWrapper}>
      <span className={styles.dateHeader}>{label}</span>
    </div>
  );
};

export default DateHeader;
