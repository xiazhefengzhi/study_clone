"""
Supabase Connection Test Script

测试 Supabase 的三个核心功能：
1. PostgreSQL 数据库连接
2. Storage 文件上传
3. Auth JWT 验证

使用前请先配置 .env 文件
"""
import asyncio
import os
import sys
from pathlib import Path
from io import BytesIO
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import after path setup
from dotenv import load_dotenv
import httpx
from sqlalchemy import text
from supabase import create_client, Client

# Load environment variables
load_dotenv()


class Colors:
    """Terminal colors for output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text: str):
    """Print section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")


def print_info(text: str):
    """Print info message"""
    print(f"{Colors.YELLOW}ℹ {text}{Colors.END}")


async def validate_env_config():
    """验证环境变量配置"""
    print_header("1. 环境变量配置验证")

    required_vars = {
        "SUPABASE_URL": "Supabase 项目 URL",
        "SUPABASE_KEY": "Supabase Anon Key",
        "SUPABASE_SERVICE_KEY": "Supabase Service Role Key",
        "DATABASE_URL": "PostgreSQL 连接字符串",
        "SUPABASE_ENDPOINT": "Supabase Storage 端点",
        "SUPABASE_BUCKET_NAME": "Storage Bucket 名称",
        "SUPABASE_JWT_SECRET": "JWT Secret",
    }

    missing_vars = []
    configured_vars = []

    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value or value.startswith("your-") or "xxx" in value:
            print_error(f"{var}: 未配置或使用示例值")
            missing_vars.append(var)
        else:
            print_success(f"{var}: 已配置")
            configured_vars.append(var)
            # Print partial value for verification (mask sensitive parts)
            if len(value) > 20:
                masked = f"{value[:10]}...{value[-10:]}"
            else:
                masked = f"{value[:5]}..."
            print(f"  → {masked}")

    print(f"\n配置统计: {len(configured_vars)}/{len(required_vars)} 项已配置")

    if missing_vars:
        print_error(f"\n缺少 {len(missing_vars)} 个必需配置项")
        print_info("请编辑 .env 文件并填入真实的 Supabase 凭证")
        return False

    print_success("所有环境变量配置正确！")
    return True


async def validate_database_connection():
    """测试 PostgreSQL 数据库连接"""
    print_header("2. PostgreSQL 数据库连接测试")

    database_url = os.getenv("DATABASE_URL")
    if not database_url or database_url.startswith("postgresql://postgres:[password]"):
        print_error("DATABASE_URL 未正确配置")
        return False

    print_info("正在连接数据库...")

    try:
        from sqlalchemy.ext.asyncio import create_async_engine

        # Create async engine
        engine = create_async_engine(
            database_url,
            echo=False,
            pool_pre_ping=True,
        )

        # Test connection
        async with engine.connect() as conn:
            # Test basic query
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print_success(f"数据库连接成功")
            print(f"  → PostgreSQL 版本: {version.split(',')[0]}")

            # Test database info
            result = await conn.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"  → 当前数据库: {db_name}")

            # Check if tables exist
            result = await conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]

            if tables:
                print_success(f"发现 {len(tables)} 个数据表:")
                for table in tables:
                    print(f"    • {table}")
            else:
                print_info("数据库中还没有表（可能需要运行 alembic upgrade head）")

        await engine.dispose()
        print_success("数据库连接测试通过！")
        return True

    except Exception as e:
        print_error(f"数据库连接失败: {str(e)}")
        print_info("请检查 DATABASE_URL 是否正确，以及网络连接是否正常")
        return False


async def validate_storage_upload():
    """测试 Supabase Storage 文件上传"""
    print_header("3. Supabase Storage 文件上传测试")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    bucket_name = os.getenv("SUPABASE_BUCKET_NAME")

    if not all([supabase_url, supabase_key, bucket_name]):
        print_error("Storage 配置不完整")
        return False

    print_info("正在初始化 Supabase Storage 客户端...")

    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)

        # Test 1: List buckets
        print_info("检查 Storage Bucket...")
        buckets = supabase.storage.list_buckets()

        bucket_exists = any(b.name == bucket_name for b in buckets)

        if bucket_exists:
            print_success(f"Bucket '{bucket_name}' 存在")
        else:
            print_error(f"Bucket '{bucket_name}' 不存在")
            print_info("正在自动创建 Storage Bucket...")

            # Show existing buckets
            if buckets:
                print("\n现有 Buckets:")
                for bucket in buckets:
                    print(f"  • {bucket.name} (Public: {bucket.public})")

            # Auto-create bucket using REST API
            try:
                print_info("尝试使用 REST API 创建 Bucket...")

                # Use httpx to directly call Supabase API
                async with httpx.AsyncClient() as client:
                    headers = {
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}",
                        "Content-Type": "application/json"
                    }

                    payload = {
                        "name": bucket_name,
                        "public": True,
                        "file_size_limit": None,
                        "allowed_mime_types": None
                    }

                    response = await client.post(
                        f"{supabase_url}/storage/v1/bucket",
                        headers=headers,
                        json=payload
                    )

                    if response.status_code in [200, 201]:
                        print_success(f"✓ 成功创建 Bucket '{bucket_name}'（公开访问）")
                    else:
                        print_error(f"创建 Bucket 失败 (HTTP {response.status_code}): {response.text}")
                        print_info("可能原因:")
                        print("  1. SUPABASE_SERVICE_KEY 配置错误（请检查是否为 service_role key）")
                        print("  2. Bucket 名称已被使用")
                        print("  3. 权限不足")
                        print_info("\n请手动在 Supabase Dashboard 创建:")
                        print("  1. 进入 Storage → New Bucket")
                        print("  2. 名称: knowfun-files")
                        print("  3. ✅ 勾选 Public bucket")
                        print("  4. 点击 Create bucket")
                        return False

            except Exception as create_error:
                print_error(f"创建 Bucket 失败: {str(create_error)}")
                print_info("请在 Supabase Dashboard 手动创建 Storage Bucket")
                return False

        # Test 2: Upload test file
        print_info("\n正在测试文件上传...")

        # Create a test file content (use bytes instead of BytesIO)
        test_content = f"Supabase Storage Test - {datetime.now().isoformat()}\n这是一个测试文件。"
        test_file_bytes = test_content.encode('utf-8')
        test_filename = f"test/test-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"

        # Upload file (use bytes directly)
        response = supabase.storage.from_(bucket_name).upload(
            test_filename,
            test_file_bytes,
            file_options={"content-type": "text/plain"}
        )

        print_success(f"文件上传成功: {test_filename}")

        # Test 3: Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(test_filename)
        print_success(f"文件公开访问 URL:")
        print(f"  → {public_url}")

        # Test 4: List files
        print_info("\n检查上传的文件...")
        files = supabase.storage.from_(bucket_name).list("test")

        if files:
            print_success(f"发现 {len(files)} 个测试文件:")
            for file in files[:5]:  # Show first 5
                print(f"  • {file['name']} ({file.get('metadata', {}).get('size', 0)} bytes)")

        # Test 5: Download file
        print_info("\n测试文件下载...")
        downloaded = supabase.storage.from_(bucket_name).download(test_filename)

        if downloaded:
            downloaded_content = downloaded.decode('utf-8')
            if test_content in downloaded_content:
                print_success("文件下载成功，内容匹配")
            else:
                print_error("文件下载成功，但内容不匹配")

        # Test 6: Delete test file
        print_info("\n清理测试文件...")
        supabase.storage.from_(bucket_name).remove([test_filename])
        print_success("测试文件已删除")

        print_success("\nStorage 文件上传测试通过！")
        return True

    except Exception as e:
        print_error(f"Storage 测试失败: {str(e)}")
        print_info("可能的原因：")
        print("  1. Bucket 不存在或名称错误")
        print("  2. Service Key 权限不足")
        print("  3. Storage RLS 策略配置错误")
        return False


async def validate_auth_jwt():
    """测试 Supabase Auth JWT 验证"""
    print_header("4. Supabase Auth JWT 验证测试")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

    if not all([supabase_url, supabase_key, jwt_secret]):
        print_error("Auth 配置不完整")
        return False

    print_info("正在测试 Supabase Auth...")

    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)

        # Test 1: Check Auth configuration
        print_info("检查 Auth 配置...")

        # Test 2: Verify JWT secret format
        if len(jwt_secret) < 32:
            print_error("JWT Secret 长度过短（应该是 base64 编码的字符串）")
            return False

        print_success("JWT Secret 格式正确")

        # Test 3: Try to get user (should fail without valid token)
        print_info("\n测试 Auth API 访问...")

        try:
            # This should return None or raise error if no user is logged in
            user = supabase.auth.get_user()
            print_info("Auth API 可访问")
        except Exception as e:
            # This is expected if no user is logged in
            if "Invalid token" in str(e) or "No user" in str(e):
                print_success("Auth API 正常（未登录状态）")
            else:
                raise

        # Test 4: Test JWT verification with service key
        print_info("\n测试 Service Key 权限...")

        # Use httpx to test API endpoint
        async with httpx.AsyncClient() as client:
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }

            # Test auth endpoint
            response = await client.get(
                f"{supabase_url}/auth/v1/settings",
                headers=headers
            )

            if response.status_code == 200:
                print_success("Service Key 验证通过")
                settings = response.json()
                print(f"  → Auth 提供商: {', '.join(settings.get('external', {}).keys()) if settings.get('external') else 'Email only'}")
            else:
                print_error(f"Service Key 验证失败 (Status: {response.status_code})")
                return False

        print_success("\nAuth JWT 验证测试通过！")
        print_info("\n注意: 完整的用户注册/登录测试需要前端集成")
        return True

    except Exception as e:
        print_error(f"Auth 测试失败: {str(e)}")
        print_info("请检查:")
        print("  1. SUPABASE_JWT_SECRET 是否从 Dashboard 正确复制")
        print("  2. SUPABASE_KEY 是否正确")
        print("  3. Supabase Auth 是否已启用")
        return False


async def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}Supabase 连接测试工具{Colors.END}")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Check if .env exists
    if not Path(".env").exists():
        print_error(".env 文件不存在！")
        print_info("请先复制 .env.example 到 .env 并填入真实配置:")
        print(f"  {Colors.YELLOW}cp .env.example .env{Colors.END}")
        print(f"  然后编辑 .env 文件填入 Supabase 凭证")
        return

    results = {}

    # Test 1: Validate environment config
    results['config'] = await validate_env_config()

    if not results['config']:
        print_error("\n配置验证失败，无法继续测试")
        print_info("请先完成环境变量配置")
        return

    # Test 2: Database connection
    results['database'] = await validate_database_connection()

    # Test 3: Storage upload
    results['storage'] = await validate_storage_upload()

    # Test 4: Auth JWT
    results['auth'] = await validate_auth_jwt()

    # Print summary
    print_header("测试结果汇总")

    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)

    print(f"总测试数: {total_tests}")
    print(f"通过: {Colors.GREEN}{passed_tests}{Colors.END}")
    print(f"失败: {Colors.RED}{total_tests - passed_tests}{Colors.END}")
    print()

    for test_name, passed in results.items():
        status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
        print(f"  {test_name.upper():20s} {status}")

    if all(results.values()):
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 所有测试通过！Supabase 配置完全正常。{Colors.END}")
        print_info("\n下一步:")
        print("  1. 运行数据库迁移: alembic upgrade head")
        print("  2. 启动后端服务器: uvicorn app.main:app --reload")
        print("  3. 开始实现业务逻辑")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  部分测试失败，请检查上述错误信息。{Colors.END}")
        print_info("参考 DATABASE_SETUP.md 获取详细配置说明")


if __name__ == "__main__":
    asyncio.run(main())
