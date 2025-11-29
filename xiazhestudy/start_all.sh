#!/bin/bash

# KnowFun 自动启动脚本
# 自动启动前端和后端服务

set -e  # 遇到错误时退出

echo "=========================================="
echo "🚀 KnowFun 自动启动脚本"
echo "=========================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ==================== 清理现有进程 ====================
echo ""
echo "🧹 清理现有进程..."

# 清理后端进程（端口 8000）
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ⚠️  发现后端进程正在运行，正在关闭..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 2
    echo "   ✅ 后端进程已清理"
else
    echo "   ℹ️  后端端口 8000 空闲"
fi

# 清理前端进程（端口 3000）
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ⚠️  发现前端进程正在运行，正在关闭..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
    echo "   ✅ 前端进程已清理"
else
    echo "   ℹ️  前端端口 3000 空闲"
fi

# ==================== 启动后端 ====================
echo ""
echo "🔧 启动后端服务..."
cd "$BACKEND_DIR"

# 启动后端（后台运行）
echo "   ▶️  启动 FastAPI 服务 (端口 8000)..."
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-exclude 'check/*' > /tmp/knowfun_backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   📝 日志文件: /tmp/knowfun_backend.log"

# 等待后端启动
echo "   ⏳ 等待后端服务启动..."
sleep 5

# 检查后端是否启动成功
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ 后端服务启动成功"
    echo "   🔗 后端地址: http://localhost:8000"
    echo "   📖 API 文档: http://localhost:8000/docs"
else
    echo "   ❌ 后端服务启动失败"
    echo "   📝 查看日志: tail -f /tmp/knowfun_backend.log"
    exit 1
fi

# ==================== 启动前端 ====================
echo ""
echo "🎨 启动前端服务..."
cd "$FRONTEND_DIR"

# 检查前端依赖
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  未找到 node_modules，正在安装依赖..."
    npm install
fi

# 启动前端（后台运行）
echo "   ▶️  启动 Next.js 开发服务器 (端口 3000)..."
nohup npm run dev > /tmp/knowfun_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✅ 前端服务已启动 (PID: $FRONTEND_PID)"
echo "   📝 日志文件: /tmp/knowfun_frontend.log"

# 等待前端启动（Next.js 需要编译时间）
echo "   ⏳ 等待前端服务启动（Next.js 编译中，可能需要 20-30 秒）..."

# 循环检查前端是否启动（最多等待 60 秒）
for i in {1..12}; do
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "   ✅ 前端服务启动成功"
        echo "   🔗 前端地址: http://localhost:3000"
        break
    fi

    if [ $i -eq 12 ]; then
        echo "   ❌ 前端服务启动超时"
        echo "   📝 查看日志: tail -f /tmp/knowfun_frontend.log"
        echo "   ℹ️  前端进程仍在运行，可能仍在编译中，请稍后访问 http://localhost:3000"
    else
        echo "   ⏳ 等待中... ($((i * 5))秒)"
        sleep 5
    fi
done

# ==================== 启动完成 ====================
echo ""
echo "=========================================="
echo "🎉 KnowFun 启动完成！"
echo "=========================================="
echo ""
echo "📌 服务信息："
echo "   后端 API: http://localhost:8000"
echo "   API 文档: http://localhost:8000/docs"
echo "   前端应用: http://localhost:3000"
echo ""
echo "📝 日志文件："
echo "   后端日志: tail -f /tmp/knowfun_backend.log"
echo "   前端日志: tail -f /tmp/knowfun_frontend.log"
echo ""
echo "🛑 停止服务："
echo "   后端: lsof -ti:8000 | xargs kill"
echo "   前端: lsof -ti:3000 | xargs kill"
echo "   全部: lsof -ti:8000,3000 | xargs kill"
echo ""
echo "=========================================="
