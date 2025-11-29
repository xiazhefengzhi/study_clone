"""
Quick Database Connection Test
快速数据库连接测试

只测试数据库连接，不需要其他配置
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text


async def check_database_connection():
    # Use asyncpg driver for async SQLAlchemy
    DATABASE_URL = "postgresql+asyncpg://postgres:lTzQv3hiSqgZeD7t@db.mtiemnxytobghwsahvot.supabase.co:5432/postgres"

    print("=" * 60)
    print("PostgreSQL 数据库快速连接测试")
    print("=" * 60)
    print()

    try:
        print("正在连接数据库...")

        engine = create_async_engine(
            DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
        )

        async with engine.connect() as conn:
            # Test 1: Database version
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print("✓ 数据库连接成功！")
            print(f"  PostgreSQL 版本: {version.split(',')[0]}")
            print()

            # Test 2: Current database
            result = await conn.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"  当前数据库: {db_name}")
            print()

            # Test 3: Check tables
            result = await conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]

            if tables:
                print(f"✓ 发现 {len(tables)} 个数据表:")
                for table in tables:
                    print(f"    • {table}")
            else:
                print("ℹ 数据库中还没有表")
                print("  运行以下命令创建表:")
                print("  alembic upgrade head")

            print()
            print("=" * 60)
            print("✓ 数据库连接测试通过！")
            print("=" * 60)

        await engine.dispose()
        return True

    except Exception as e:
        print(f"✗ 数据库连接失败: {str(e)}")
        print()
        print("请检查:")
        print("  1. 数据库密码是否正确")
        print("  2. 网络连接是否正常")
        print("  3. Supabase 项目是否已启动")
        return False


if __name__ == "__main__":
    asyncio.run(check_database_connection())
