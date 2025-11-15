# 关于测试文件命名说明

本项目**不使用 pytest** 进行测试。

## ⚠️ 重要变更

### 文件已重命名

为了避免 IDE（如 PyCharm）自动使用 pytest 运行测试，测试脚本已重命名：

| 原文件名 | 新文件名 | 用途 |
|---------|---------|------|
| `test_db_quick.py` | `check_db_connection.py` | 快速数据库连接测试 |
| `test_supabase.py` | `verify_supabase.py` | 完整 Supabase 功能验证 |

## 📋 为什么不使用 pytest？

1. **测试脚本是独立工具**
   - 这些脚本是用于验证配置的工具，不是单元测试
   - 需要直接用 Python 运行以便查看详细输出

2. **避免 IDE 自动检测**
   - 文件名以 `test_` 开头会被 pytest 自动识别
   - IDE 会尝试用 pytest 运行，导致不必要的依赖

3. **简化运行方式**
   - 直接运行：`python check_db_connection.py`
   - 无需安装 pytest
   - 输出更清晰易读

## 🚫 禁用 pytest

已创建 `pytest.ini` 文件明确禁用 pytest：

```ini
# pytest configuration
# This project does NOT use pytest for testing

[pytest]
python_files =
python_classes =
python_functions =
```

## ✅ 正确运行方式

### 数据库连接测试
```bash
python check_db_connection.py
```

### 完整 Supabase 验证
```bash
python verify_supabase.py
```

## 🔧 IDE 配置建议

### PyCharm

如果 PyCharm 仍然尝试使用 pytest：

1. **File** → **Settings**
2. **Tools** → **Python Integrated Tools**
3. **Testing** → **Default test runner**
4. 选择 **Unittests** 或 **None**

### VS Code

如果 VS Code 尝试使用 pytest：

1. 打开 Command Palette (Cmd+Shift+P)
2. 输入 "Python: Configure Tests"
3. 选择 "Disable testing"

## 📝 注意事项

- ✅ 直接用 `python` 命令运行脚本
- ❌ 不要用 `pytest` 运行
- ❌ 不要用 IDE 的测试运行器
- ✅ 可以在终端直接运行查看完整输出

## 🔄 相关文档更新

所有文档中的测试命令已更新为新文件名：

- ✅ `CONFIG_STATUS.md` - 已更新
- ✅ `TESTING.md` - 已更新
- ✅ `GET_API_KEYS.md` - 已更新
- ✅ `DATABASE_SETUP.md` - 已更新

---

**如果你看到 pytest 错误**，请：

1. 确认使用 `python` 命令而非 `pytest`
2. 检查 IDE 设置，禁用自动测试检测
3. 使用终端运行，不要使用 IDE 的运行按钮
