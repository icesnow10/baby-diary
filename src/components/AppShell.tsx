import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  Baby,
  BarChart3,
  BriefcaseMedical,
  ClipboardList,
  Milk,
  Moon,
  Package,
  Pill,
  Ruler,
  Sun,
} from "lucide-react";
import { useThemeMode } from "@/context/ThemeContext";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/", label: "Dashboard", icon: <BarChart3 size={18} /> },
  { key: "/sleep", label: "Sleep", icon: <Moon size={18} /> },
  { key: "/feeding", label: "Feeding", icon: <Milk size={18} /> },
  { key: "/diaper", label: "Diapers", icon: <Baby size={18} /> },
  { key: "/pump", label: "Pumping", icon: <BriefcaseMedical size={18} /> },
  { key: "/growth", label: "Growth", icon: <Ruler size={18} /> },
  { key: "/medicine", label: "Medicine", icon: <Pill size={18} /> },
  { key: "/inventory", label: "Inventory", icon: <Package size={18} /> },
];

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
        <ClipboardList size={22} />
        <span>Baby Diary</span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedPath]}
        items={items}
        className="navMenu"
      />
    </Sider>
  );

  return (
    <Layout className="appLayout">
      {sider}
      <Layout>
        <Header className="topbar">
          <Space size={12}>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {title}
              </Typography.Title>
              {subtitle ? <Typography.Text type="secondary">{subtitle}</Typography.Text> : null}
            </div>
          </Space>
          <Button icon={mode === "dark" ? <Sun size={18} /> : <Moon size={18} />} onClick={toggle} />
        </Header>
        <Content className="pageContent">{children}</Content>
        <nav className="bottomNav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link key={item.key} href={item.key} className={selectedPath === item.key ? "bottomNavItem active" : "bottomNavItem"} aria-label={item.label}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </Layout>
    </Layout>
  );
}
