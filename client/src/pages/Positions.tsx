import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  Select,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

interface Position {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  departmentId: string;
  department?: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

const Positions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [form] = Form.useForm();

  const fetchPositions = async () => {
    try {
      const response = await axios.get("/api/positions");
      setPositions(response.data);
    } catch (error) {
      message.error("Failed to fetch positions");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/departments");
      setDepartments(response.data);
    } catch (error) {
      message.error("Failed to fetch departments");
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchDepartments();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await axios.post("/api/positions", values);
      message.success("Position created successfully");
      setIsModalVisible(false);
      form.resetFields();
      fetchPositions();
    } catch (error) {
      message.error("Failed to create position");
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingPosition) return;
    try {
      await axios.put(`/api/positions/${editingPosition.id}`, values);
      message.success("Position updated successfully");
      setIsModalVisible(false);
      form.resetFields();
      setEditingPosition(null);
      fetchPositions();
    } catch (error) {
      message.error("Failed to update position");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/positions/${id}`);
      message.success("Position deleted successfully");
      fetchPositions();
    } catch (error) {
      message.error("Failed to delete position");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (isActive ? "Active" : "Inactive"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Position) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingPosition(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this position?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingPosition(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Create Position
        </Button>
      </div>

      <Table dataSource={positions} columns={columns} rowKey="id" />

      <Modal
        title={editingPosition ? "Edit Position" : "Create Position"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingPosition(null);
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          onFinish={editingPosition ? handleUpdate : handleCreate}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input position name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            name="departmentId"
            label="Department"
            rules={[{ required: true, message: "Please select a department!" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Select a department"
            >
              {departments.map((department) => (
                <Select.Option key={department.id} value={department.id}>
                  {department.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Positions;
