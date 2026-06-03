/** Course/blog image helpers — UI only, no API changes */
window.AVID_MEDIA = {
  courseImage(c) {
    const icon = c?.icon_url || '';
    const thumb = c?.thumbnail_url || '';
    if (thumb && !String(thumb).includes('bg.jpg')) return thumb;
    if (icon && String(icon).startsWith('http')) return icon;
    return './img/lessons.png';
  },
  courseImageClass(c) {
    const thumb = c?.thumbnail_url || '';
    const icon = c?.icon_url || '';
    if ((!thumb || String(thumb).includes('bg.jpg')) && icon && String(icon).startsWith('http')) {
      return 'courses-img courses-img--tech';
    }
    return 'courses-img';
  },
};
