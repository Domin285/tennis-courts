import React, { useId, useState } from "react";
import styles from "./NavBar.module.scss";

export type AppTab = "client" | "search" | "admin";

interface NavBarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
}

interface NavigationItem {
  value: AppTab;
  label: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    value: "client",
    label: "Rezerwacja kortu",
  },
  {
    value: "search",
    label: "Szukaj rezerwacji",
  },
  {
    value: "admin",
    label: "Panel administratora",
  },
];

export const NavBar: React.FC<NavBarProps> = ({ activeTab, onChangeTab }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const generatedId = useId();

  const navigationId = `${generatedId}-main-navigation`;

  const handleTabChange = (tab: AppTab) => {
    onChangeTab(tab);
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((currentValue) => !currentValue);
  };

  return (
    <header className={styles.navbar}>
      <div
        className={[
          "container-xxl",
          "d-flex",
          "align-items-center",
          "justify-content-between",
          "flex-wrap",
          "gap-2",
          "py-3",
          styles.inner,
        ].join(" ")}
      >
        <div className={styles.brand}>Rezerwacja kortów tenisowych</div>

        <button
          type="button"
          className={[
            "btn",
            "btn-outline-light",
            styles.toggle,
            menuOpen ? styles.toggleOpen : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={
            menuOpen ? "Zamknij menu nawigacyjne" : "Otwórz menu nawigacyjne"
          }
          aria-expanded={menuOpen}
          aria-controls={navigationId}
          onClick={toggleMenu}
        >
          <span className={styles.toggleLine} aria-hidden="true" />

          <span className={styles.toggleLine} aria-hidden="true" />

          <span className={styles.toggleLine} aria-hidden="true" />
        </button>

        <nav
          id={navigationId}
          className={[styles.navigation, menuOpen ? styles.navigationOpen : ""]
            .filter(Boolean)
            .join(" ")}
          aria-label="Główna nawigacja"
        >
          {NAVIGATION_ITEMS.map((item) => {
            const active = activeTab === item.value;

            return (
              <button
                key={item.value}
                type="button"
                className={[
                  "btn",
                  styles.tab,
                  active ? styles.activeTab : styles.inactiveTab,
                ].join(" ")}
                aria-current={active ? "page" : undefined}
                onClick={() => handleTabChange(item.value)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
