#!/bin/bash
# 便捷启动脚本

echo "🚀 KnowFun Backend 启动脚本"
echo "=========================="
echo ""
echo "选择启动方式："
echo "1. 开发模式 - uvicorn (推荐)"
echo "2. PM2 模式 - 进程管理"
echo ""
read -p "请选择 (1/2): " choice

case $choice in
  1)
    echo ""
    echo "🔧 使用 uvicorn 启动（开发模式）..."
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ;;
  2)
    echo ""
    echo "🔧 使用 PM2 启动..."
    if ! command -v pm2 &> /dev/null; then
      echo "❌ PM2 未安装"
      echo "📦 正在安装 PM2..."
      npm install -g pm2
    fi
    pm2 start ecosystem.config.json
    echo ""
    echo "✅ 后端已启动！"
    echo ""
    echo "常用命令："
    echo "  pm2 status            - 查看状态"
    echo "  pm2 logs              - 查看日志"
    echo "  pm2 restart knowfun-backend - 重启"
    echo "  pm2 stop knowfun-backend    - 停止"
    ;;
  *)
    echo "❌ 无效选择"
    exit 1
    ;;
esac
