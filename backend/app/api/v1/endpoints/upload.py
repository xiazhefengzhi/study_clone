from fastapi import APIRouter, UploadFile, File
from app.utils.file_upload import image_uploader

router = APIRouter()


@router.post("/image", summary="上传单张图片")
async def upload_image(file: UploadFile = File(...)):
    """
    上传图片接口 (Supabase Storage)

    - 支持格式: jpg, jpeg, png, gif, webp
    - 最大限制: 5MB
    - 存储位置: Supabase Storage (云端)
    - 返回: 图片的公开访问 URL
    """
    img_url = await image_uploader.save_image(file, folder="uploads")
    return {"code": 200, "message": "上传成功", "url": img_url}


@router.post("/avatar", summary="上传用户头像")
async def upload_avatar(file: UploadFile = File(...)):
    """
    上传用户头像接口

    - 存储在 avatars 文件夹下
    - 支持格式: jpg, jpeg, png, gif, webp
    - 最大限制: 5MB
    """
    img_url = await image_uploader.save_image(file, folder="avatars")
    return {"code": 200, "message": "头像上传成功", "url": img_url}


@router.post("/course/cover", summary="上传课程封面")
async def upload_course_cover(file: UploadFile = File(...)):
    """
    上传课程封面接口

    - 存储在 courses 文件夹下
    - 支持格式: jpg, jpeg, png, gif, webp
    - 最大限制: 5MB
    """
    img_url = await image_uploader.save_image(file, folder="courses")
    return {"code": 200, "message": "课程封面上传成功", "url": img_url}
