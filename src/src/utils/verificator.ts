import type { ColorResolvable } from 'discord.js';

export function verifyAndSetHEXColor(color: string): ColorResolvable {
    if (color && /^[0-9A-F]{6}$/i.test(color)) {
        return `#${color}`;
    } else if (color && /^#[0-9A-F]{6}$/i.test(color)) {
        return `${color}` as ColorResolvable;
    } else {
        return randomHexColor();
    }
}

function randomHexColor(): ColorResolvable {
    const letters = '0123456789ABCDEF';
    let color = '';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return `#${color}`;
}

export async function validateThumbnailURL(url: string) {
    // Check if empty
    if (!url || url.trim() === '') {
        return true;
    }

    // Check if valid URL format
    try {
        const urlObj = new URL(url);

        // Discord requires HTTPS for thumbnails
        if (urlObj.protocol !== 'https:') {
            throw new Error('Thumbnail must use HTTPS');
        }
    } catch (error) {
        return false;
    }

    // Check if URL points to an actual image
    try {
        const response = await fetch(url, {
            method: 'HEAD'
        });

        if (!response.ok) {
            return false;
        }

        // Check Content-Type header
        const contentType = response.headers.get('content-type');

        // Valid image types for Discord
        const validImageTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        return validImageTypes.some(type => contentType?.includes(type));
    } catch (error) {
        // Network error or timeout
        return false;
    }
}
