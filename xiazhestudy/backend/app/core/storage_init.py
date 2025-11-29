"""
Supabase Storage Bucket Initialization

Automatically creates required storage buckets on application startup.
"""
import logging
from typing import Dict, List, Optional
import requests
from app.core.config import settings


logger = logging.getLogger(__name__)


class StorageInitializer:
    """
    Supabase Storage bucket initializer.

    Automatically checks and creates required buckets on app startup.
    All operations are idempotent (safe to run multiple times).
    """

    # Required buckets configuration
    BUCKETS_CONFIG = [
        {
            "name": "images",
            "public": True,
            "description": "User avatars, course covers, and general images"
        },
        {
            "name": "knowfun-files",
            "public": True,
            "description": "Documents, exported files, and user content"
        }
    ]

    def __init__(self):
        """Initialize with Supabase credentials from settings"""
        self.supabase_url = settings.SUPABASE_URL
        self.service_key = settings.SUPABASE_SERVICE_KEY

        if not self.supabase_url or not self.service_key:
            logger.warning(
                "Supabase credentials not configured. "
                "Storage bucket initialization will be skipped."
            )

    def ensure_buckets_exist(self) -> Dict[str, bool]:
        """
        Ensure all required buckets exist, creating them if necessary.

        Returns:
            Dict mapping bucket names to success status (True = exists/created, False = failed)
        """
        if not self.supabase_url or not self.service_key:
            logger.info("Skipping storage initialization (credentials not configured)")
            return {}

        logger.info("Checking Supabase Storage buckets...")
        results = {}

        for config in self.BUCKETS_CONFIG:
            bucket_name = config["name"]
            exists = self._check_bucket_exists(bucket_name)

            if exists:
                logger.info(f"✓ Bucket '{bucket_name}' already exists")
                results[bucket_name] = True
            else:
                logger.info(f"○ Bucket '{bucket_name}' not found, creating...")
                created = self._create_bucket(
                    name=bucket_name,
                    public=config["public"]
                )

                if created:
                    logger.info(f"✓ Bucket '{bucket_name}' created successfully")
                    results[bucket_name] = True
                else:
                    logger.error(f"✗ Failed to create bucket '{bucket_name}'")
                    results[bucket_name] = False

        # Print summary
        success_count = sum(1 for v in results.values() if v)
        total_count = len(results)

        if success_count == total_count:
            logger.info(f"Storage: {success_count}/{total_count} buckets ready ✓")
        else:
            logger.warning(
                f"Storage: {success_count}/{total_count} buckets ready "
                f"({total_count - success_count} failed)"
            )
            self._print_manual_instructions(results)

        return results

    def _check_bucket_exists(self, bucket_name: str) -> bool:
        """
        Check if a bucket exists.

        Args:
            bucket_name: Name of the bucket to check

        Returns:
            True if bucket exists, False otherwise
        """
        try:
            url = f"{self.supabase_url}/storage/v1/bucket/{bucket_name}"
            headers = {
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}"
            }

            response = requests.get(url, headers=headers, timeout=10)

            # 200 = bucket exists, 404 = bucket not found
            return response.status_code == 200

        except Exception as e:
            logger.error(f"Error checking bucket '{bucket_name}': {e}")
            return False

    def _create_bucket(self, name: str, public: bool = True) -> bool:
        """
        Create a new storage bucket using Supabase REST API.

        Args:
            name: Bucket name
            public: Whether bucket should be publicly accessible (default: True)

        Returns:
            True if bucket was created (or already exists), False on failure
        """
        try:
            url = f"{self.supabase_url}/storage/v1/bucket"
            headers = {
                "apikey": self.service_key,
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "name": name,
                "public": public,
                "file_size_limit": 5 * 1024 * 1024,  # 5MB limit
                "allowed_mime_types": None  # Allow all types
            }

            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=10
            )

            # 200/201 = created successfully, 409 = already exists (also success)
            if response.status_code in [200, 201, 409]:
                return True

            # Log detailed error for debugging
            logger.error(
                f"Bucket creation failed for '{name}': "
                f"Status {response.status_code}, Response: {response.text}"
            )
            return False

        except Exception as e:
            logger.error(f"Exception creating bucket '{name}': {e}")
            return False

    def _print_manual_instructions(self, results: Dict[str, bool]):
        """
        Print manual bucket creation instructions for failed buckets.

        Args:
            results: Dict mapping bucket names to success status
        """
        failed_buckets = [name for name, success in results.items() if not success]

        if not failed_buckets:
            return

        logger.info("\n" + "="*60)
        logger.info("📋 Manual Bucket Creation Instructions")
        logger.info("="*60)
        logger.info(
            "\nAuto-creation failed for some buckets. "
            "Please create them manually:\n"
        )
        logger.info("1. Visit your Supabase Dashboard:")
        logger.info(f"   {self.supabase_url.replace('https://', 'https://app.supabase.com/project/')}")
        logger.info("\n2. Navigate to: Storage → New Bucket")
        logger.info("\n3. Create the following buckets:\n")

        for bucket_name in failed_buckets:
            config = next((c for c in self.BUCKETS_CONFIG if c["name"] == bucket_name), None)
            if config:
                logger.info(f"   • Bucket Name: {bucket_name}")
                logger.info(f"     Public Access: {'Yes' if config['public'] else 'No'}")
                logger.info(f"     Purpose: {config['description']}\n")

        logger.info("4. After creating buckets, restart the application.\n")
        logger.info("="*60 + "\n")


def init_storage() -> Optional[Dict[str, bool]]:
    """
    Initialize Supabase Storage buckets on application startup.

    This is a convenience function to be called from app lifespan.

    Returns:
        Dict mapping bucket names to success status, or None if skipped
    """
    try:
        initializer = StorageInitializer()
        return initializer.ensure_buckets_exist()
    except Exception as e:
        logger.error(f"Storage initialization failed: {e}")
        return None
