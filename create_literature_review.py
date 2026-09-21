from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

OUTPUT = "/Users/sohamagarwal/dev/SecDog/Rule_Based_Fuzzing_Literature_Review.docx"
doc = Document()
section = doc.sections[0]
section.page_width, section.page_height = Inches(8.5), Inches(11)
section.top_margin = section.bottom_margin = Inches(0.9)
section.left_margin = section.right_margin = Inches(1.0)

normal = doc.styles["Normal"]
normal.font.name, normal.font.size = "Arial", Pt(12)
normal.font.color.rgb = RGBColor(0, 0, 0)
normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
normal.paragraph_format.line_spacing = 1.12
normal.paragraph_format.space_after = Pt(9)

title = doc.styles["Title"]
title.font.name, title.font.size, title.font.bold = "Arial", Pt(16), True
title.font.color.rgb = RGBColor(0, 0, 0)
title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
title.paragraph_format.space_after = Pt(12)

heading = doc.styles["Heading 1"]
heading.font.name, heading.font.size, heading.font.bold = "Arial", Pt(13), True
heading.font.color.rgb = RGBColor(0, 0, 0)
heading.paragraph_format.space_before = Pt(3)
heading.paragraph_format.space_after = Pt(7)
heading.paragraph_format.keep_with_next = True

doc.add_paragraph("Literature Review on Rule Based Fuzzing for Web Application Security", style="Title")
doc.add_paragraph("Research Background and Proposed Method", style="Heading 1")

page_one = [
    "Brandi, Perrone, and Romano (2024), in Sniping at Web Applications to Discover Input Handling Vulnerabilities, propose a rule based fuzzer for detecting SQL injection, cross site scripting, and path traversal. These weaknesses arise when web applications process data from forms, URLs, headers, cookies, or request bodies without adequate validation. Since large applications expose many input points, testing each one manually requires considerable time. The study therefore examines how malicious test inputs and expert security knowledge can be combined to automate vulnerability discovery.",
    "Fuzzing tests software by sending unexpected or malicious inputs, called payloads, and examining the resulting behaviour. A database error after an SQL payload, an unusual response delay, or access to file content may indicate a weakness. However, unusual behaviour alone does not prove that a vulnerability exists. This difficulty is known as the Oracle Problem. Earlier studies applied mutation, genetic algorithms, source code analysis, and artificial intelligence to security testing, but many of these approaches concentrate on one vulnerability, depend on a particular language, or require access to the application's internal code. The authors address this gap with an opaque box method that works through HTTP requests and responses.",
    "The proposed system contains five modules. The Proxy uses Mitmproxy to record a valid request and response while a tester normally uses the target application. The Repeater converts the captured request into a template by replacing selected input values with placeholders. The Intruder fills these placeholders with attack payloads and sends the modified requests. It performs a Sniper Attack, changing one parameter at a time while keeping the remaining values valid. This identifies which input caused the abnormal response. The initial collection contained 67 SQL injection payloads, 59 path traversal payloads, and 15 XSS payloads.",
    "The Analyzer compares each attack response with the original valid response. It considers the status code, response text, error messages, content length, response time, and payload category. It converts these differences into structured Analyzer Observations. The Oracle then evaluates the observations through a Prolog knowledge base containing expert defined rules. For example, an SQL payload followed by a database error that was absent from the normal response may satisfy an SQL injection rule. This structure makes the result explainable because the tester can identify the evidence and rule behind each report. The authors developed the rules through security experience and PortSwigger laboratory exercises, refining either the payload or the rule whenever a known vulnerability was missed."
]
for text in page_one:
    doc.add_paragraph(text)

second_heading = doc.add_paragraph("Evaluation and Critical Review", style="Heading 1")
second_heading.paragraph_format.page_break_before = True

page_two = [
    "The researchers evaluated the fuzzer using WAVSEP based cases: 125 SQL injection cases, 117 path traversal cases, 55 XSS cases, and 103 WordPress cases treated as non vulnerable. The initial system achieved accuracy values of 0.75 for SQL injection, 0.85 for path traversal, and 0.65 for XSS. Recall was 1.00 for SQL injection and path traversal and 0.98 for XSS, meaning that it found nearly all known vulnerable cases. Its lower precision showed that it also produced false positives. The original XSS method treated reflection of a payload as evidence of execution, although reflected code may be safely encoded. After the authors used a headless browser to verify actual JavaScript execution, XSS accuracy increased to 0.99 and precision reached 1.00.",
    "The tool was also compared with OWASP ZAP. On the selected benchmark, the rule based fuzzer achieved recall values of 1.00 for SQL injection, 1.00 for path traversal, and 0.98 for XSS, compared with ZAP's 0.59, 0.53, and 0.83. The proposed system therefore found more benchmark vulnerabilities, while ZAP initially produced fewer false positives for SQL injection and path traversal. These results show a tradeoff between finding vulnerabilities and limiting false alarms, rather than proving that one scanner is always better. The study also examined efficiency. Using 77 payloads generated 58,058 requests with 0.79 accuracy, while 143 payloads generated 106,642 requests with 0.85 accuracy. The authors reduced redundant requests by grouping payloads according to database type, operating system, quotation style, encoding, filtering, and XSS reflection context. Optimization reduced SQL injection payloads from 67 to 29, path traversal payloads from 59 to 5, and XSS payloads from 15 to 13.",
    "The study's main strengths are its modular design, explainable Prolog rules, high reported recall, and independence from the target application's programming language. Its public implementation also supports further research. However, the evaluation covers only three vulnerability categories and depends on one main benchmark. The system requires suitable payloads and manually maintained rules, so unknown attacks may be missed and broad rules may produce false positives. Capturing requests and selecting injection points also require human participation. The paper is relevant to SentinelAPI because both systems apply rules to web security, although their functions differ. The paper's fuzzer actively attacks an external application and compares responses to discover vulnerabilities, whereas SentinelAPI monitors its own API, blocks suspicious requests, stores alerts, and displays them on a dashboard. Overall, the paper shows that reliable fuzzing depends on effective payload selection and accurate response interpretation. Its architecture provides an explainable foundation for automated testing, but broader vulnerability coverage and continuous rule maintenance remain necessary."
]
for text in page_two:
    doc.add_paragraph(text)

footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = footer.add_run()
begin, instruction, end = OxmlElement("w:fldChar"), OxmlElement("w:instrText"), OxmlElement("w:fldChar")
begin.set(qn("w:fldCharType"), "begin")
instruction.set(qn("xml:space"), "preserve")
instruction.text = "PAGE"
end.set(qn("w:fldCharType"), "end")
run._r.extend([begin, instruction, end])
run.font.name, run.font.size = "Arial", Pt(9)

doc.save(OUTPUT)
print(OUTPUT)
