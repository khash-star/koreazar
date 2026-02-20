import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Privacy() {
  const baseUrl = 'https://zarkorea.com';
  const privacyUrl = `${baseUrl}/Privacy`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6 text-sm font-medium"
        >
          ← Нүүр хуудас руу буцах
        </Link>

        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Нууцлалын бодлого
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Сүүлд шинэчлэгдсэн: 2026 оны 2 сар
          </p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">1. Танилцуулга</h2>
              <p>
                Koreazar (заркореа.com) нь Солонгост амьдарч буй Монголчуудын зарын платформ юм. 
                Энэхүү нууцлалын бодлого нь бид хэрхэн таны өгөгдлийг цуглуулж, хадгалж, 
                ашигладаг талаар тайлбарлана.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">2. Цуглуулдаг өгөгдөл</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Бүртгэлийн өгөгдөл:</strong> имэйл, нууц үг, нэр, утасны дугаар</li>
                <li><strong>Facebook нэвтрэлт:</strong> нэр, имэйл, профайл зураг (зөвхөн Facebook-ээр нэвтрэх үед)</li>
                <li><strong>Зарын өгөгдөл:</strong> гарчиг, дүрслэл, зураг, үнэ, ангилал, холбоо барих мэдээлэл</li>
                <li><strong>Мессежийн өгөгдөл:</strong> илгээсэн мессежүүд (conversations, messages)</li>
                <li><strong>Хадгалсан зарууд:</strong> таны хадгалсан заруудын жагсаалт</li>
                <li><strong>Техникийн өгөгдөл:</strong> IP хаяг, төхөөрөмжийн мэдээлэл, браузер төрөл</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">3. Өгөгдлийг хадгалах болон боловсруулах</h2>
              <p>
                Бид дараах үйлчилгээнүүдийг ашигладаг:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Firebase Authentication</strong> — нэвтрэлт, бүртгэл удирдлага</li>
                <li><strong>Cloud Firestore</strong> — зарууд, хэрэглэгчийн профайл, мессеж хадгалах</li>
                <li><strong>Firebase Storage</strong> — зарын зураг хадгалах</li>
                <li><strong>OpenAI API</strong> — AI туслах функц (ашигласан үед)</li>
              </ul>
              <p className="mt-2">
                Өгөгдөл нь Google-ийн дата төвд хадгалагддаг.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">4. Өгөгдлийг ашиглах зорилго</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Таныг нэвтрүүлэх, бүртгэл удирдлага</li>
                <li>Заруудыг нийтлэх, засварлах, устгах</li>
                <li>Зарын эзэн болон худалдан авагч хооронд мессеж илгээх</li>
                <li>Хууль сахиулах шаардлага хангах</li>
                <li>Үйлчилгээг сайжруулах, техникийн асуудлыг шийдвэрлэх</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">5. Cookies болон Local Storage</h2>
              <p>
                Бид нэвтрэлтийн төлөв (session), хэрэглэгчийн сонголтуудыг хадгалахын тулд 
                localStorage болон sessionStorage ашигладаг. Та нэвтрэлтээс гарсны дараа 
                session тооцоолол өөрчлөгдөнө.
              </p>
              <p className="mt-2">
                Firebase, Facebook нэвтрэлт нь өөрсдийн cookies ашигладаг.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">6. Өгөгдөл хуваалцах</h2>
              <p>
                Бид таны хувийн мэдээллийг гуравдагч талд зарагдахгүй. Гэхдээ дараах тохиолдолд 
                хуваалцаж болно: хууль ёсны шаардлага, албан ёсны эрх баригчид, эсвэл таны зөвшөөрлөөр.
              </p>
              <p className="mt-2">
                Зарын холбоо барих мэдээлэл (утас, имэйл) нь зарыг үзсэн хэрэглэгчдэд харагдана.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">7. Таны эрх</h2>
              <p>Та дараах зүйлсийг хүсэж болно:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Өөрийн өгөгдлийг харах, засварлах</li>
                <li>Бүртгэлээ устгах</li>
                <li>Заруудаа устгах</li>
                <li>Мессежүүдээ устгах</li>
              </ul>
              <p className="mt-2">
                Үүнийг Профайл хуудаснаас эсвэл бидэнтэй холбогдоно уу.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">8. Холбоо барих</h2>
              <p>
                Асуулт, санал хүсэлтээ илгээхийг хүсвэл:
              </p>
              <p className="mt-2">
                <strong>Koreazar / KHASH Co Ltd</strong><br />
                Вэбсайт: <a href={baseUrl} className="text-amber-600 hover:underline">{baseUrl}</a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">9. Өөрчлөлт</h2>
              <p>
                Энэхүү бодлогыг шинэчилбэл энэ хуудас дээр огноо шинэчлэгдэнэ. Их өөрчлөлт орсон 
                тохиолдолд танд мэдэгдэх боломжтой.
              </p>
            </section>
          </div>
        </article>

        <p className="text-center text-sm text-gray-500 mt-8">
          Play Store-д тавихын тулд энэ хуудсын хаяг: <strong>{privacyUrl}</strong>
        </p>
      </div>
    </div>
  );
}
