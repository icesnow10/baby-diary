import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  Baby,
  BarChart3,
  Bell,
  BriefcaseMedical,
  Heart,
  Milk,
  Moon,
  MoreHorizontal,
  Package,
  Pill,
  Ruler,
  Sun,
} from "lucide-react";
import { useThemeMode } from "@/context/ThemeContext";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/", label: "Home", icon: <BarChart3 size={18} /> },
  { key: "/sleep", label: "Sleep", icon: <Moon size={18} /> },
  { key: "/feeding", label: "Feeding", icon: <Milk size={18} /> },
  { key: "/diaper", label: "Diapers", icon: <Baby size={18} /> },
  { key: "/pump", label: "Pumping", icon: <BriefcaseMedical size={18} /> },
  { key: "/growth", label: "Growth", icon: <Ruler size={18} /> },
  { key: "/medicine", label: "Medicine", icon: <Pill size={18} /> },
  { key: "/inventory", label: "Inventory", icon: <Package size={18} /> },
];

const bottomItems = navItems.slice(0, 5);
const moreItems = navItems.slice(5);

export default function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { mode, toggle } = useThemeMode();
  const selectedPath = router.pathname === "/" ? "/" : `/${router.pathname.split("/")[1]}`;

  const items: MenuProps["items"] = navItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: <Link href={item.key}>{item.label}</Link>,
  }));

  const sider = (
    <Sider width={244} className="appSider">
      <div className="brand">
        <div className="babyMark">
          <Baby size={24} />
        </div>
        <div>
          <strong>BabyCare</strong>
          <small>All your baby care in one place</small>
        </div>
      </div>
      <div className="babyProfile">
        <div className="babyAvatar">
          <Baby size={36} />
        </div>
        <div>
          <strong>Emma</strong>
          <span>3 months, 12 days</span>
        </div>
        <Heart className="heartIcon" size={16} fill="currentColor" />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedPath]}
        items={items}
        className="navMenu"
      />
      <div className="sideQuick">
        <strong>Quick Add</strong>
        <span>Add an entry with one tap</span>
        <div className="sideQuickGrid">
          {bottomItems.slice(1).map((item) => (
            <Link key={item.key} href={item.key} className="quickTile">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          {moreItems.slice(0, 2).map((item) => (
            <Link key={item.key} href={item.key} className="quickTile">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </Sider>
  );

  return (
    <Layout className="appLayout">
      {sider}
      <Layout>
        <Header className="topbar">
          <Space size={12}>
            <div>
              <Typography.Title level={3} className="pageTitle">
                {title}
              </Typography.Title>
              {subtitle ? <Typography.Text type="secondary">{subtitle}</Typography.Text> : null}
            </div>
          </Space>
          <Space>
            <Button className="topIconButton" icon={<Bell size={18} />} />
            <Button className="topIconButton" icon={mode === "dark" ? <Sun size={18} /> : <Moon size={18} />} onClick={toggle} />
          </Space>
        </Header>
        <Content className="pageContent">{children}</Content>
        <nav className="bottomNav" aria-label="Mobile navigation">
          {bottomItems.map((item) => (
            <Link key={item.key} href={item.key} className={selectedPath === item.key ? "bottomNavItem active" : "bottomNavItem"} aria-label={item.label}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <div className={moreItems.some((item) => item.key === selectedPath) ? "bottomMore active" : "bottomMore"}>
            <button className="bottomNavItem bottomMoreButton" type="button" aria-label="More sections">
              <MoreHorizontal size={18} />
              <span>More</span>
            </button>
            <div className="bottomMoreMenu" aria-label="More navigation">
              {moreItems.map((item) => (
                <Link key={item.key} href={item.key} className="bottomMoreItem" aria-label={item.label}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </Layout>
    </Layout>
  );
}
