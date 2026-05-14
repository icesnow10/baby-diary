import { Button, DatePicker, Form, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AppShell from "@/components/AppShell";
import DeleteButton from "@/components/DeleteButton";
import { useData } from "@/context/DataContext";
import { formatDateTime, formatDuration, newId } from "@/lib/format";
import type { SleepEntry } from "@/lib/types";

export default function SleepPage() {
  const { data, add, remove } = useData();
  const [form] = Form.useForm();

  const columns: ColumnsType<SleepEntry> = [
    { title: "Start", dataIndex: "start", render: formatDateTime },
    { title: "End", dataIndex: "end", render: formatDateTime },
    { title: "Duration", render: (_, entry) => formatDuration(entry.start, entry.end ?? undefined) },
    { title: "", width: 64, render: (_, entry) => <DeleteButton onConfirm={() => remove("sleep", entry.id)} /> },
  ];

  return (
    <AppShell title="Sleep" subtitle="Track each sleep session with start and end time.">
      <section className="panel">
        <Typography.Title level={4}>New sleep entry</Typography.Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            await add("sleep", {
              id: newId(),
              start: values.start.toISOString(),
              end: values.end.toISOString(),
            });
            form.resetFields();
          }}
        >
          <div className="formGrid">
            <Form.Item name="start" label="Start time" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="end" label="End time" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit">
            Save sleep
          </Button>
        </Form>
      </section>
      <section className="panel">
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Title level={4}>History</Typography.Title>
          <Table rowKey="id" columns={columns} dataSource={[...data.sleep].sort((a, b) => dayjs(b.start).valueOf() - dayjs(a.start).valueOf())} />
        </Space>
      </section>
    </AppShell>
  );
}
