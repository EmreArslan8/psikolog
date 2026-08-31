# Psikolog Web Sitesi

Modern, sade ve mobil uyumlu iki sayfalı statik web sitesi.

## Sayfalar

- `index.html` — Ana sayfa
- `ben-kimim.html` — Hakkımda / Ben Kimim

## Kullanım

Dosyaları doğrudan tarayıcıda açabilir veya klasör içinde basit bir yerel sunucu çalıştırabilirsiniz:

```bash
python3 -m http.server 8080
```

Tasarım dili `eylulsaygi.com` referans alınarak Psikolog Selin Ünal için özgün biçimde uyarlanmıştır. Blog ve SSS bölümleri özellikle eklenmemiştir. Portre, eğitim, uzmanlık ve iletişim alanlarındaki yer tutucu bilgiler gerçek bilgilerle değiştirilmelidir.

## Yayın öncesi kontrol listesi

Müşteri verisi bekleyen (kod tarafı hazır, sadece değer girilecek):

- [ ] Telefon numarası — `tel:` linki header/footer + schema `"telephone"` alanı
- [ ] Açık adres — `index.html` schema `streetAddress` ve `geo` koordinatı (şu an Karabük merkez)
- [ ] Portre fotoğrafı — `hero` ve `ben-kimim` içindeki `.photo-placeholder` yerine
- [ ] Eğitim / sertifika bilgileri — `credentials-card` ve `education-list`
- [ ] Sosyal medya hesapları — `data-social` nitelikli `<a hidden>` linkleri (gerçek URL girilip `hidden` kaldırılacak, ayrıca schema `sameAs` yeniden eklenecek)
- [ ] "Uzman Psikolog" unvanı — yüksek lisans yoksa `title` etiketlerinden çıkarılmalı
- [ ] Form uç noktası — `script.js` içindeki `FORM_ENDPOINT` / `FORM_ACCESS_KEY`

Yayın günü:

- [ ] Google Search Console doğrulama + `sitemap.xml` gönderimi
- [ ] GA4 kurulumu
- [ ] Google Business Profile açılışı ve doğrulaması
- [ ] Sunucuda 404 yönlendirmesi `404.html` sayfasına bağlanmalı
