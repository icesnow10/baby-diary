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
  Home,
  Lightbulb,
  Milk,
  Moon,
  MoreHorizontal,
  Package,
  Pill,
  Plus,
  Ruler,
  Sun,
} from "lucide-react";
import { useThemeMode } from "@/context/ThemeContext";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/", label: "Home", icon: <BarChart3 size={18} /> },
  { key: "/insights", label: "Insights", icon: <Lightbulb size={18} /> },
  { key: "/sleep", label: "Sleep", icon: <Moon size={18} /> },
  { key: "/feeding", label: "Feeding", icon: <Milk size={18} /> },
  { key: "/diaper", label: "Diapers", icon: <Baby size={18} /> },
  { key: "/pump", label: "Pumping", icon: <BriefcaseMedical size={18} /> },
  { key: "/growth", label: "Growth", icon: <Ruler size={18} /> },
  { key: "/medicine", label: "Medicine", icon: <Pill size={18} /> },
  { key: "/inventory", label: "Inventory", icon: <Package size={18} /> },
];

const quickItems = navItems.filter((item) => ["/sleep", "/feeding", "/diaper", "/pump", "/medicine", "/growth"].includes(item.key));
const moreItems = navItems.filter((item) => ["/sleep", "/feeding", "/diaper", "/pump", "/medicine", "/inventory"].includes(item.key));

function BabyPortrait({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <span className="portraitFace" />
      <span className="portraitCap" />
      <span className="portraitWrap" />
    </div>
  );
}

export default function AppShell({
  title,
  subtitle,
  onAddClick,
  children,
}: {
  title: string;
  subtitle?: string;
  onAddClick?: () => void;
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
        <BabyPortrait className="babyAvatar" />
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
          {quickItems.slice(0, 4).map((item) => (
            <Link key={item.key} href={item.key} className="quickTile">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          {quickItems.slice(4, 6).map((item) => (
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
          <div className="mobileBabyHeader">
            <BabyPortrait className="mobileHeaderAvatar" />
            <div className="mobileHeaderText">
              <div className="mobileHeaderName">
                <strong>Emma</strong>
                <Heart size={16} fill="currentColor" stroke="none" />
              </div>
              <span>3 months, 12 days</span>
            </div>
          </div>
          <div className="desktopHeaderText">
            <Typography.Title level={3} className="pageTitle">
              {title}
            </Typography.Title>
            {subtitle ? <Typography.Text type="secondary">{subtitle}</Typography.Text> : null}
          </div>
          <Space>
            <Button className="topIconButton" icon={<Bell size={18} />} />
            <Button className="topIconButton themeButton" icon={mode === "dark" ? <Sun size={18} /> : <Moon size={18} />} onClick={toggle} />
          </Space>
        </Header>
        <Content className="pageContent">{children}</Content>
        <nav className="bottomNav" aria-label="Mobile navigation">
          <Link href="/" className={selectedPath === "/" ? "bottomNavItem active" : "bottomNavItem"} aria-label="Home">
            <Home size={22} />
            <span>Home</span>
          </Link>
          <Link href="/insights" className={selectedPath === "/insights" ? "bottomNavItem active" : "bottomNavItem"} aria-label="Insights">
            <Lightbulb size={21} />
            <span>Insights</span>
          </Link>
          {onAddClick ? (
            <button className="bottomAddButton" aria-label="Add entry" type="button" onClick={onAddClick}>
              <Plus size={34} />
            </button>
          ) : (
          <Link href="/feeding" className="bottomAddButton" aria-label="Add entry">
            <Plus size={34} />
          </Link>
          )}
          <Link href="/growth" className={selectedPath === "/growth" ? "bottomNavItem active" : "bottomNavItem"} aria-label="Growth">
            <Ruler size={22} />
            <span>Growth</span>
          </Link>
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
