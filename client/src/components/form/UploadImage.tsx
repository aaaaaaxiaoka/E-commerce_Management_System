import { useState } from "react";
import { Upload, message } from "antd";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { storage } from "@/utils/storage";

interface UploadImageProps {
  value?: string;
  onChange?: (url: string) => void;
  maxCount?: number;
}

export default function UploadImage({ value, onChange, maxCount = 1 }: UploadImageProps) {
  const [loading, setLoading] = useState(false);

  const fileList: UploadFile[] = value
    ? [{ uid: "-1", name: "image", status: "done", url: value }]
    : [];

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("只能上传图片文件");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("图片大小不能超过 5MB");
      return false;
    }
    return true;
  };

  const customRequest = async (options: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", options.file);

      const token = storage.get<string>("accessToken");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.code === 200) {
        onChange?.(data.data.url);
        options.onSuccess(data, options.file);
        message.success("上传成功");
      } else {
        options.onError(new Error(data.message));
      }
    } catch (err) {
      options.onError(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  return (
    <Upload
      listType="picture-card"
      fileList={fileList}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      maxCount={maxCount}
      onRemove={() => onChange?.("")}
    >
      {fileList.length >= maxCount ? null : uploadButton}
    </Upload>
  );
}
