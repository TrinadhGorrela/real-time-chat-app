import { formatters } from "../../utils/dateFormatter";
import styles from "./Dateheader.module.css";

const DateHeader = ({ date }) => {
  const label = formatters.dateHeader(date);

  return (
    <div className={styles.dateHeaderWrapper}>
      <span className={styles.dateHeader}>{label}</span>
    </div>
  );
};

export default DateHeader;
