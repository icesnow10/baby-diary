import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, DatePicker, Form, Input, Layout, Menu, Modal, Space, Typography, Upload } from "antd";
import type { MenuProps } from "antd";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import {
  Baby,
  BarChart3,
  Bell,
  BriefcaseMedical,
  Clock,
  Heart,
  Home,
  LineChart,
  Milk,
  Moon,
  MoreHorizontal,
  Package,
  Pill,
  Plus,
  Sun,
} from "lucide-react";
import { useThemeMode } from "@/context/ThemeContext";
import { useData } from "@/context/DataContext";
import PullToRefresh from "@/components/PullToRefresh";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/home", label: "Home", icon: <BarChart3 size={18} /> },
  { key: "/history", label: "History", icon: <Clock size={18} /> },
  { key: "/insights", label: "Insights", icon: <LineChart size={18} /> },
  { key: "/sleep", label: "Sleep", icon: <Moon size={18} /> },
  { key: "/feeding", label: "Feeding", icon: <Milk size={18} /> },
  { key: "/diaper", label: "Diapers", icon: <Baby size={18} /> },
  { key: "/pump", label: "Pumping", icon: <BriefcaseMedical size={18} /> },
  { key: "/medicine", label: "Medicine", icon: <Pill size={18} /> },
  { key: "/inventory", label: "Inventory", icon: <Package size={18} /> },
];

const quickItems = navItems.filter((item) => ["/sleep", "/feeding", "/diaper", "/pump", "/medicine", "/insights"].includes(item.key));
const moreItems = navItems.filter((item) => ["/sleep", "/feeding", "/diaper", "/pump", "/medicine", "/inventory"].includes(item.key));

function profileAge(birthDate?: string) {
  if (!birthDate) return "";
  const birth = dayjs(birthDate);
  if (!birth.isValid()) return "";
  const now = dayjs();
  const months = now.diff(birth, "month");
  const days = now.diff(birth.add(months, "month"), "day");
  const weeks = now.diff(birth, "week");
  const weekDays = now.diff(birth.add(weeks, "week"), "day");
  const weeksLabel = `${weeks} weeks, ${Math.max(0, weekDays)} days`;
  if (months <= 0) return `${Math.max(0, days)} days (${weeksLabel})`;
  return `${months} months, ${days} days (${weeksLabel})`;
}

function BabyPortrait({ className = "", src, onClick }: { className?: string; src?: string; onClick?: () => void }) {
  return (
    <button className={`${className} babyPortraitButton`} type="button" onClick={onClick} aria-label="Edit baby profile">
      {src ? <img src={src} alt="" /> : (
        <>
          <span className="portraitFace" />
          <span className="portraitCap" />
          <span className="portraitWrap" />
        </>
      )}
    </button>
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
  const { data, updateProfile } = useData();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm] = Form.useForm();
  const profile = data.profile;
  const profileName = profile.name || "Baby";
  const profileSubtitle = profileAge(profile.birthDate);
  const rawPath = router.pathname === "/" ? "/home" : `/${router.pathname.split("/")[1]}`;
  const selectedPath = rawPath;
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onDocPointer = (event: PointerEvent | MouseEvent) => {
      if (!moreRef.current) return;
      if (moreRef.current.contains(event.target as Node)) return;
      setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [moreOpen]);

  useEffect(() => {
    setMoreOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!profileOpen) return;
    profileForm.setFieldsValue({
      name: profile.name,
      birthDate: profile.birthDate ? dayjs(profile.birthDate) : undefined,
      avatarUrl: profile.avatarUrl,
    });
  }, [profileOpen, profile, profileForm]);

  const avatarFileList = useMemo<UploadFile[]>(() => (
    profile.avatarUrl ? [{ uid: "-1", name: "avatar", status: "done", url: profile.avatarUrl }] : []
  ), [profile.avatarUrl]);

  const items: MenuProps["items"] = navItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
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
        <BabyPortrait className="babyAvatar" src={profile.avatarUrl} onClick={() => setProfileOpen(true)} />
        <div>
          <strong>{profileName}</strong>
          <span>{profileSubtitle}</span>
        </div>
        <Heart className="heartIcon" size={16} fill="currentColor" />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedPath]}
        items={items}
        className="navMenu"
        onClick={({ key }) => {
          const nextPath = String(key);
          if (nextPath !== selectedPath) router.push(nextPath === "/home" ? "/" : nextPath);
        }}
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
      <PullToRefresh />
      {sider}
      <Layout>
        <Header className="topbar">
          <div className="mobileBabyHeader">
            <BabyPortrait className="mobileHeaderAvatar" src={profile.avatarUrl} onClick={() => setProfileOpen(true)} />
            <div className="mobileHeaderText">
              <div className="mobileHeaderName">
                <strong>{profileName}</strong>
                <Heart size={16} fill="currentColor" stroke="none" />
              </div>
              <span>{profileSubtitle}</span>
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
        <Modal
          open={profileOpen}
          title="Baby profile"
          footer={null}
          maskClosable={false}
          keyboard={false}
          onCancel={() => setProfileOpen(false)}
          className="addRecordModal"
        >
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={async (values) => {
              await updateProfile({
                name: values.name,
                birthDate: values.birthDate ? values.birthDate.format("YYYY-MM-DD") : undefined,
                avatarUrl: values.avatarUrl,
              });
              setProfileOpen(false);
            }}
          >
            <Form.Item name="avatarUrl" hidden>
              <Input />
            </Form.Item>
            <Form.Item label="Image">
              <Upload
                accept="image/*"
                listType="picture-card"
                maxCount={1}
                fileList={avatarFileList}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => profileForm.setFieldValue("avatarUrl", reader.result);
                  reader.readAsDataURL(file);
                  return false;
                }}
                onRemove={() => {
                  profileForm.setFieldValue("avatarUrl", undefined);
                  return true;
                }}
              >
                Upload
              </Upload>
            </Form.Item>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="birthDate" label="Birth date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <div className="modalActions">
              <Button className="entrySave modalSave" htmlType="submit">
                Save
              </Button>
              <Button className="modalClose" onClick={() => setProfileOpen(false)}>
                Close
              </Button>
            </div>
          </Form>
        </Modal>
      </Layout>
      {mounted
        ? createPortal(
            <nav className="bottomNav" aria-label="Mobile navigation">
              <a
                href="/home"
                className={selectedPath === "/home" ? "bottomNavItem active" : "bottomNavItem"}
                aria-label="Home"
                onClick={(event) => {
                  event.preventDefault();
                  router.push("/home");
                }}
              >
                <Home size={22} />
                <span>Home</span>
              </a>
              <a
                href="/history"
                className={selectedPath === "/history" ? "bottomNavItem active" : "bottomNavItem"}
                aria-label="History"
                onClick={(event) => {
                  event.preventDefault();
                  router.push("/history");
                }}
              >
                <Clock size={21} />
                <span>History</span>
              </a>
              {onAddClick ? (
                <button className="bottomAddButton" aria-label="Add entry" type="button" onClick={onAddClick}>
                  <Plus size={34} />
                </button>
              ) : (
                <a
                  href="/feeding"
                  className="bottomAddButton"
                  aria-label="Add entry"
                  onClick={(event) => {
                    event.preventDefault();
                    router.push("/feeding");
                  }}
                >
                  <Plus size={34} />
                </a>
              )}
              <a
                href="/insights"
                className={selectedPath === "/insights" ? "bottomNavItem active" : "bottomNavItem"}
                aria-label="Insights"
                onClick={(event) => {
                  event.preventDefault();
                  router.push("/insights");
                }}
              >
                <LineChart size={22} />
                <span>Insights</span>
              </a>
              <div
                ref={moreRef}
                className={
                  (moreItems.some((item) => item.key === selectedPath) ? "bottomMore active" : "bottomMore") +
                  (moreOpen ? " open" : "")
                }
              >
                <button
                  className="bottomNavItem bottomMoreButton"
                  type="button"
                  aria-label="More sections"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((prev) => !prev)}
                >
                  <MoreHorizontal size={18} />
                  <span>More</span>
                </button>
                <div className="bottomMoreMenu" aria-label="More navigation">
                  {moreItems.map((item) => (
                    <a
                      key={item.key}
                      href={item.key === "/home" ? "/home" : item.key}
                      className="bottomMoreItem"
                      aria-label={item.label}
                      onClick={(event) => {
                        event.preventDefault();
                        setMoreOpen(false);
                        router.push(item.key);
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </nav>,
            document.body,
          )
        : null}
    </Layout>
  );
}
