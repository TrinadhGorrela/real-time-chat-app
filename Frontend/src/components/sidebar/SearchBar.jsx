import styles from "./SearchBar.module.css";

const SearchBar = ({ value, onChange }) => {
  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchWrapper}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          className={styles.searchBar}
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SearchBar;
