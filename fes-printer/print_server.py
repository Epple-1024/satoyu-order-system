# print_server.py (レイアウト最終調整・完全版)
from flask import Flask, request, jsonify
from flask_cors import CORS
from escpos.printer import Usb
from PIL import Image, ImageDraw, ImageFont
import qrcode
import datetime

app = Flask(__name__)
CORS(app)

# --- 設定 ---
CONFIG = {
    "printer": { "vendor_id": 0x28e9, "product_id": 0x0289 },
    "layout": { "width": 384 },
    "fonts": {
        "regular": "/usr/share/fonts/myfonts/LINESeedJP_OTF_Rg.otf",
        "bold": "/usr/share/fonts/myfonts/LINESeedJP_A_OTF_Bd.otf",
        "sizes": {
            "title_satoyu": 40, "title_tagline": 18, "header": 20,
            "item_name": 22, "item_detail": 16, "total": 28, "footer": 18
        }
    },
    "qr_code": { "dot_size": 5, "border": 2 }
}

def generate_receipt_image(order_data):
    try:
        # --- フォント準備 ---
        font_satoyu = ImageFont.truetype(CONFIG["fonts"]["bold"], CONFIG["fonts"]["sizes"]["title_satoyu"])
        font_tagline = ImageFont.truetype(CONFIG["fonts"]["regular"], CONFIG["fonts"]["sizes"]["title_tagline"])
        font_header = ImageFont.truetype(CONFIG["fonts"]["bold"], CONFIG["fonts"]["sizes"]["header"])
        font_item_name = ImageFont.truetype(CONFIG["fonts"]["regular"], CONFIG["fonts"]["sizes"]["item_name"])
        font_item_detail = ImageFont.truetype(CONFIG["fonts"]["regular"], CONFIG["fonts"]["sizes"]["item_detail"])
        font_total = ImageFont.truetype(CONFIG["fonts"]["bold"], CONFIG["fonts"]["sizes"]["total"])
        font_footer = ImageFont.truetype(CONFIG["fonts"]["regular"], CONFIG["fonts"]["sizes"]["footer"])

        # --- QRコード生成 ---
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=CONFIG["qr_code"]["dot_size"], border=CONFIG["qr_code"]["border"])
        qr.add_data(order_data["feedback_url"])
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert('1')

        # --- 動的な高さ計算 ---
        y = 15 # 上端の余白
        draw_calc = ImageDraw.Draw(Image.new('L', (1,1)))
        y += draw_calc.textbbox((0,0), "SATOYU", font=font_satoyu)[3]
        y += draw_calc.textbbox((0,0), "– Café & Puzzle Lounge", font=font_tagline)[3] + 20
        y += draw_calc.textbbox((0,0), "注文番号", font=font_header)[3] + 15
        for item in order_data['items']:
            y += draw_calc.textbbox((0,0), item['name'], font=font_item_name)[3] + 2
            y += draw_calc.textbbox((0,0), " ", font=font_item_detail)[3] + 5
        y += 20
        y += draw_calc.textbbox((0,0), "合計", font=font_total)[3] + 20
        y += qr_img.height + 10
        y += draw_calc.textbbox((0,0), "アンケートにご協力ください。", font=font_footer)[3] + 5
        y += draw_calc.textbbox((0,0), "ご利用ありがとうございました！", font=font_footer)[3] + 15 # 下端の余白

        # --- 描画 ---
        image = Image.new('1', (CONFIG["layout"]["width"], y), color=1)
        draw = ImageDraw.Draw(image)
        y = 15

        # ヘッダー
        text = "SATOYU"
        w = draw.textbbox((0,0), text, font=font_satoyu)[2]
        draw.text(((CONFIG["layout"]["width"] - w) / 2, y), text, font=font_satoyu, fill=0)
        y += draw.textbbox((0,0), text, font=font_satoyu)[3]
        text = "– Café & Puzzle Lounge"
        w = draw.textbbox((0,0), text, font=font_tagline)[2]
        draw.text(((CONFIG["layout"]["width"] - w) / 2, y), text, font=font_tagline, fill=0)
        y += draw.textbbox((0,0), text, font=font_tagline)[3] + 15
        draw.line([(10, y), (CONFIG["layout"]["width"] - 10, y)], fill=0, width=1)
        y += 5
        
        # --- ▼注文日時表示を追加 ---
        now = datetime.datetime.now().strftime("%Y/%m/%d %H:%M")
        w_date = draw.textbbox((0,0), now, font=font_item_detail)[2]
        draw.text((10, y), f"注文番号: {order_data['order_id']}", font=font_header, fill=0)
        draw.text((CONFIG["layout"]["width"] - w_date - 10, y + 2), now, font=font_item_detail, fill=0)
        y += draw.textbbox((0,0), " ", font=font_header)[3] + 5
        draw.line([(10, y), (CONFIG["layout"]["width"] - 10, y)], fill=0, width=1)
        y += 10

        # 明細
        for item in order_data['items']:
            draw.text((15, y), item['name'], font=font_item_name, fill=0)
            y += draw.textbbox((0,0), item['name'], font=font_item_name)[3] + 2
            price_line = f"({item['price']:,}円 x {item['quantity']})"
            subtotal_text = f"¥{item['price'] * item['quantity']:,}"
            w_subtotal = draw.textbbox((0,0), subtotal_text, font=font_item_name)[2]
            draw.text((25, y), price_line, font=font_item_detail, fill=0)
            draw.text((CONFIG["layout"]["width"] - w_subtotal - 10, y), subtotal_text, font=font_item_name, fill=0)
            y += draw.textbbox((0,0), " ", font=font_item_detail)[3] + 5

        y += 10
        draw.line([(10, y), (CONFIG["layout"]["width"] - 10, y)], fill=0, width=1)
        y += 10
        
        # 合計
        total_text = f"¥{order_data['total']:,}"
        w_total = draw.textbbox((0,0), total_text, font=font_total)[2]
        draw.text((15, y), "合計", font=font_total, fill=0)
        draw.text((CONFIG["layout"]["width"] - w_total - 10, y), total_text, font=font_total, fill=0)
        y += draw.textbbox((0,0), total_text, font=font_total)[3] + 20

        # QRコードとフッターテキスト
        qr_x_pos = int((CONFIG["layout"]["width"] - qr_img.width) / 2)
        image.paste(qr_img, (qr_x_pos, y))
        y += qr_img.height + 10
        text = "アンケートにご協力ください。"
        w = draw.textbbox((0,0), text, font=font_footer)[2]
        draw.text(((CONFIG["layout"]["width"] - w) / 2, y), text, font=font_footer, fill=0)
        y += draw.textbbox((0,0), text, font=font_footer)[3] + 5
        text = "ご利用ありがとうございました！"
        w = draw.textbbox((0,0), text, font=font_footer)[2]
        draw.text(((CONFIG["layout"]["width"] - w) / 2, y), text, font=font_footer, fill=0)
        
        return image
    except Exception as e:
        print(f"Image generation error: {e}")
        return None

@app.route('/')
def index(): return "SATOYU Print Server is running."

@app.route('/print', methods=['POST'])
def print_receipt():
    p = None
    try:
        p = Usb(idVendor=CONFIG["printer"]["vendor_id"], idProduct=CONFIG["printer"]["product_id"])
        order_data = request.get_json()
        receipt_image = generate_receipt_image(order_data)
        if receipt_image:
            p.image(receipt_image, impl="bitImageColumn")
            p.text("\n")
            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "error", "message": "Failed to generate receipt image"}), 500
    except Exception as e:
        print(f"Printing error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if p:
            p.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, ssl_context=('cert.pem', 'key.pem'))