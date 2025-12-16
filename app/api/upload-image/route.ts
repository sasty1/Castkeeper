import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    const imgbbKey = process.env.IMGBB_API_KEY;
    
    if (!imgbbKey) {
      return NextResponse.json(
        { error: 'Image hosting not configured' },
        { status: 500 }
      );
    }

    const imgbbFormData = new FormData();
    imgbbFormData.append('image', base64);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${imgbbKey}`,
      {
        method: 'POST',
        body: imgbbFormData,
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error('Image upload failed');
    }

    return NextResponse.json({
      success: true,
      url: data.data.url,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
