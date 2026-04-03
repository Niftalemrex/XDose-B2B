// src/pages/Roles/Pharmacist/CategoryTabs.tsx
import React from "react";
import { categories } from "../../../data/categories";
import type { ProductCategory } from "../../../data/categories";
import "./CategoryTabs.css";

interface CategoryTabsProps {
  active: ProductCategory;
  setActive: (category: ProductCategory) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ active, setActive }) => {
  return (
    <div className="category-tabs">
      {Object.entries(categories).map(([key, category]) => (
        <button
          key={key}
          onClick={() => setActive(key as ProductCategory)}
          className={`tab ${active === key ? "active" : ""}`}
          aria-current={active === key ? "page" : undefined}
        >
          {category.label}
          {active === key && <span className="active-indicator" />}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;