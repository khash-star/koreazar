import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PRIVACY_POLICY_URL } from "../constants/legalUrls.js";
import { openExternalUrlSafe } from "../utils/safeLinking.js";

/**
 * zarkorea.com X-Frame-Options: deny — iframe/WebView embed ажиллахгүй.
 * Вэбийн src/pages/Privacy.jsx-тай ижил агуулгыг апп дотор харуулна (iOS / Android / web).
 */
export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.inner}>
      <Text style={styles.h1}>Нууцлалын бодлого</Text>
      <Text style={styles.updated}>Сүүлд шинэчлэгдсэн: 2026 оны 2 сар</Text>

      <Section title="1. Танилцуулга">
        <Body>
          Koreazar (заркореа.com) нь Солонгост амьдарч буй Монголчуудын зарын платформ юм. Энэхүү
          нууцлалын бодлого нь бид хэрхэн таны өгөгдлийг цуглуулж, хадгалж, ашигладаг талаар
          тайлбарлана.
        </Body>
      </Section>

      <Section title="2. Цуглуулдаг өгөгдөл">
        <Bullet>
          <Bold>Бүртгэлийн өгөгдөл:</Bold> имэйл, нууц үг, нэр, утасны дугаар
        </Bullet>
        <Bullet>
          <Bold>Facebook нэвтрэлт:</Bold> нэр, имэйл, профайл зураг (зөвхөн Facebook-ээр нэвтрэх үед)
        </Bullet>
        <Bullet>
          <Bold>Зарын өгөгдөл:</Bold> гарчиг, дүрслэл, зураг, үнэ, ангилал, холбоо барих мэдээлэл
        </Bullet>
        <Bullet>
          <Bold>Мессежийн өгөгдөл:</Bold> илгээсэн мессежүүд (conversations, messages)
        </Bullet>
        <Bullet>
          <Bold>Хадгалсан зарууд:</Bold> таны хадгалсан заруудын жагсаалт
        </Bullet>
        <Bullet>
          <Bold>Техникийн өгөгдөл:</Bold> IP хаяг, төхөөрөмжийн мэдээлэл, браузер төрөл
        </Bullet>
      </Section>

      <Section title="3. Өгөгдлийг хадгалах болон боловсруулах">
        <Body>Бид дараах үйлчилгээнүүдийг ашигладаг:</Body>
        <Bullet>
          <Bold>Firebase Authentication</Bold> — нэвтрэлт, бүртгэл удирдлага
        </Bullet>
        <Bullet>
          <Bold>Cloud Firestore</Bold> — зарууд, хэрэглэгчийн профайл, мессеж хадгалах
        </Bullet>
        <Bullet>
          <Bold>Firebase Storage</Bold> — зарын зураг хадгалах
        </Bullet>
        <Bullet>
          <Bold>OpenAI API</Bold> — AI туслах функц (ашигласан үед)
        </Bullet>
        <Body>Өгөгдөл нь Google-ийн дата төвд хадгалагддаг.</Body>
      </Section>

      <Section title="4. Өгөгдлийг ашиглах зорилго">
        <Bullet>Таныг нэвтрүүлэх, бүртгэл удирдлага</Bullet>
        <Bullet>Заруудыг нийтлэх, засварлах, устгах</Bullet>
        <Bullet>Зарын эзэн болон худалдан авагч хооронд мессеж илгээх</Bullet>
        <Bullet>Хууль сахиулах шаардлага хангах</Bullet>
        <Bullet>Үйлчилгээг сайжруулах, техникийн асуудлыг шийдвэрлэх</Bullet>
      </Section>

      <Section title="5. Cookies болон Local Storage">
        <Body>
          Бид нэвтрэлтийн төлөв (session), хэрэглэгчийн сонголтуудыг хадгалахын тулд localStorage
          болон sessionStorage ашигладаг. Та нэвтрэлтээс гарсны дараа session тооцоолол
          өөрчлөгдөнө.
        </Body>
        <Body>Firebase, Facebook нэвтрэлт нь өөрсдийн cookies ашигладаг.</Body>
      </Section>

      <Section title="6. Өгөгдөл хуваалцах">
        <Body>
          Бид таны хувийн мэдээллийг гуравдагч талд зарагдахгүй. Гэхдээ дараах тохиолдолд
          хуваалцаж болно: хууль ёсны шаардлага, албан ёсны эрх баригчид, эсвэл таны
          зөвшөөрлөөр.
        </Body>
        <Body>
          Зарын холбоо барих мэдээлэл (утас, имэйл) нь зарыг үзсэн хэрэглэгчдэд харагдана.
        </Body>
      </Section>

      <Section title="7. Таны эрх">
        <Body>Та дараах зүйлсийг хүсэж болно:</Body>
        <Bullet>Өөрийн өгөгдлийг харах, засварлах</Bullet>
        <Bullet>Бүртгэлээ устгах</Bullet>
        <Bullet>Заруудаа устгах</Bullet>
        <Bullet>Мессежүүдээ устгах</Bullet>
        <Body>Үүнийг Профайл хуудаснаас эсвэл бидэнтэй холбогдоно уу.</Body>
      </Section>

      <Section title="8. Холбоо барих">
        <Body>Асуулт, санал хүсэлтээ илгээхийг хүсвэл:</Body>
        <Text style={styles.body}>
          <Text style={styles.bold}>Koreazar / KHASH Co Ltd</Text>
          {"\n"}
          Вэбсайт:{" "}
        </Text>
        <Pressable onPress={() => openExternalUrlSafe("https://zarkorea.com")} hitSlop={8}>
          <Text style={styles.link}>https://zarkorea.com</Text>
        </Pressable>
      </Section>

      <Section title="9. Өөрчлөлт">
        <Body>
          Энэхүү бодлогыг шинэчилбэл энэ хуудас дээр огноо шинэчлэгдэнэ. Их өөрчлөлт орсон
          тохиолдолд танд мэдэгдэх боломжтой.
        </Body>
      </Section>

      <Text style={styles.footerNote}>
        Албан ёсны вэб хуудасны холбоос (Store-д заавал):{"\n"}
        <Text style={styles.bold}>{PRIVACY_POLICY_URL}</Text>
      </Text>

      <Pressable style={styles.openWeb} onPress={() => openExternalUrlSafe(PRIVACY_POLICY_URL)}>
        <Text style={styles.openWebText}>Хөтөчид нээх →</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bold({ children }) {
  return <Text style={styles.bold}>{children}</Text>;
}

function Bullet({ children }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f9fafb" },
  inner: { padding: 20, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 8 },
  updated: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  section: { marginBottom: 20 },
  h2: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 10 },
  body: { fontSize: 15, color: "#374151", lineHeight: 24, marginBottom: 10 },
  bold: { fontWeight: "700", color: "#111827" },
  bulletRow: { flexDirection: "row", marginBottom: 8, paddingRight: 8 },
  bulletMark: { fontSize: 15, color: "#374151", width: 22, lineHeight: 24 },
  bulletText: { flex: 1, fontSize: 15, color: "#374151", lineHeight: 24 },
  link: { fontSize: 15, color: "#ea580c", fontWeight: "600", textDecorationLine: "underline" },
  footerNote: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
  },
  openWeb: {
    marginTop: 20,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ea580c",
    backgroundColor: "#fff",
  },
  openWebText: { color: "#ea580c", fontWeight: "700", fontSize: 15 },
});
