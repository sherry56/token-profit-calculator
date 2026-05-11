import { Download, RotateCcw, Save, Upload } from 'lucide-react';
import type { AppConfig } from '../types';

interface Props {
  config: AppConfig;
  onImport: (config: AppConfig) => void;
  onReset: () => void;
  onSave: () => void;
}

export default function ImportExportPanel({ config, onImport, onReset, onSave }: Props) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `token-profit-config-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text) as AppConfig;
      onImport(imported);
    } catch {
      window.alert('导入失败，请检查 JSON 文件格式。');
    }
  };

  return (
    <section className="panel p-4">
      <h2 className="panel-title mb-4">配置管理</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button className="btn btn-primary" type="button" onClick={onSave}>
          <Save className="h-4 w-4" />
          保存配置
        </button>
        <button className="btn btn-secondary" type="button" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          重置默认
        </button>
        <button className="btn btn-secondary" type="button" onClick={exportJson}>
          <Download className="h-4 w-4" />
          导出 JSON
        </button>
        <label className="btn btn-secondary cursor-pointer">
          <Upload className="h-4 w-4" />
          导入 JSON
          <input className="hidden" type="file" accept="application/json,.json" onChange={(event) => void importJson(event.target.files?.[0])} />
        </label>
      </div>
    </section>
  );
}
