# print_server.py (指示厳守・最終確定版)
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
    "printer": {"vendor_id": 0x28e9, "product_id": 0x0289},
    "layout": {"width": 384},
    "fonts": {
        "regular": "/usr/share/fonts/myfonts/LINESeedJP_OTF_Rg.otf",
        "bold": "/usr/share/fonts/myfonts/LINESeedJP_A_OTF_Bd.otf",
        "sizes": {
            "title_satoyu": 40, "title_tagline": 18, "header": 20,
            "item_name": 22, "item_detail": 16, "total": 28, "footer": 18
        }
    },
    "qr_code": {"dot_size": 5, "border": 2},
    # ★★★ 変更点: ロゴ画像のパスをRaspberry Pi内の絶対パスに指定 ★★★
    "logo": {"path": "/home/pi/satoyu_printer/assets/logo.png"}
}

def generate_receipt_image(order_data):
    # ★★★ 変更点: All-or-Nothingを実現するため、全体の処理をtryで囲む ★★★
    # ロゴ読み込み等で失敗した場合、この関数はNoneを返し、中途半端な印刷は行われない
    try:
        # --- フォント準備 (変更なし) ---
        font_header = ImageFont.truetype(CONFIG["fonts"]["bold"], CONFIG["fonts"]["sizes"]["header"])
        font_item = ImageFont.truetype(CONFIG["fonts"]["regular"], CONFIG["fonts"]["sizes"]["item_name"])
        font_total = ImageFont.truetype(CONFIG["fonts"]["bold"], CONFIG["fonts"]["sizes"]["total"])
        font_footer = ImageFont.truetype(CONFIG["fonts"]["regular"], CONFIG["fonts"]["sizes"]["footer"])
        
        # ★★★ 変更点: ロゴ画像の読み込み ★★★
        # ここでファイルが存在しない場合、FileNotFoundErrorが発生し、exceptブロックで捕捉される
        logo_img = Image.open(CONFIG["logo"]["path"])
        logo_ratio = CONFIG["layout"]["width"] / logo_img.width
        new_height = int(logo_img.height * logo_ratio)
        logo = logo_img.resize((CONFIG["layout"]["width"], new_height), Image.LANCZOS)
        
        # --- QRコード生成 (変更なし) ---
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=CONFIG["qr_code"]["dot_size"], border=CONFIG["qr_code"]["border"])
        qr.add_data(order_data["feedback_url"])
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert('1')

        # ★★★ 変更点: 動的な高さ計算 (承認済み機能) ★★★
        height = logo.height + 15  # ロゴの高さ + 余白
        height += 80  # ヘッダー
        height += len(order_data['items']) * 35 # 商品リスト
        height += 60 # 小計・合計のベース
        if order_data.get('discount', 0) > 0:
            height += 45 # 割引表示分
        height += qr_img.height + 100 # QRコードとフッター
        height += 30 # 全体の最終余白

        # --- 画像キャンバス生成 ---
        image = Image.new('1', (CONFIG["layout"]["width"], height), color=1)
        draw = ImageDraw.Draw(image)
        y = 10

        # --- ロゴ描画 ---
        if logo.mode == 'RGBA':
            image.paste(logo, (0, y), logo)
        else:
            image.paste(logo, (0, y))
        y += logo.height + 15

        # --- ヘッダー、商品リスト、合計などの描画 (元のコードから変更なし) ---
        now = datetime.datetime.now().strftime('%Y/%m/%d %H:%M')
        draw.text((10, y), f"注文番号: {order_data['order_id']}", font=font_header, fill=0)
        w = draw.textbbox((0, 0), now, font=font_header)[2]
        draw.text((CONFIG["layout"]["width"] - w - 10, y), now, font=font_header, fill=0)
        y += 40
        draw.line([(10, y), (CONFIG["layout"]["width"] - 10, y)], fill=0, width=2)
        y += 15

        for item in order_data['items']:
            draw.text((20, y), f"{item['name']}", font=font_item, fill=0)
            price_text = f"x{item['quantity']}  ¥{item['price'] * item['quantity']:,}"
            w = draw.textbbox((0, 0), price_text, font=font_item)[2]
            draw.text((CONFIG["layout"]["width"] - w - 20, y), price_text, font=font_item, fill=0)
            y += 35
        
        y += 10
        draw.line([(10, y), (CONFIG["layout"]["width"] - 10, y)], fill=0, width=1)
        y += 15

        total_text = f"小計  ¥{order_data['total']:,}"
        w = draw.textbbox((0, 0), total_text, font=font_item)[2]
        draw.text((CONFIG["layout"]["width"] - w - 20, y), total_text, font=font_item, fill=0)
        y += 35

        if order_data.get('discount', 0) > 0:
            coupon_code = order_data.get('coupon_code', 'クーポン')
            discount_text = f"{coupon_code}割引  - ¥{order_data['discount']:,}"
            w = draw.textbbox((0, 0), discount_text, font=font_item)[2]
            draw.text((CONFIG["layout"]["width"] - w - 20, y), discount_text, font=font_item, fill=0)
            y += 35
            draw.line([(120, y), (CONFIG["layout"]["width"] - 10, y)], fill=0, width=2)
            y += 10

        final_total_text = f"合計  ¥{order_data['final_total']:,}"
        w = draw.textbbox((0, 0), final_total_text, font=font_total)[2]
        draw.text((10, y), "ご請求額", font=font_total, fill=0)
        draw.text((CONFIG["layout"]["width"] - w - 20, y), final_total_text, font=font_total, fill=0)
        y += 50
        
        qr_x = (CONFIG["layout"]["width"] - qr_img.width) // 2
        image.paste(qr_img, (qr_x, y))
        y += qr_img.height + 10

        for text in ["アンケートにご協力ください。", "ご利用ありがとうございました！"]:
            w = draw.textbbox((0, 0), text, font=font_footer)[2]
            draw.text(((CONFIG["layout"]["width"] - w) // 2, y), text, font=font_footer, fill=0)
            y += draw.textbbox((0, 0), text, font=font_footer)[3] + 5
        
        return image

    except Exception as e:
        # ロゴ読み込み失敗など、何らかのエラーがあればここで捕捉
        print(f"レシート画像生成中にエラー: {e}")
        return None

# ★★★ 変更なし: 元のコードを維持 ★★★
@app.route('/')
def index():
    return "SATOYU Print Server is running."

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
            # generate_receipt_imageがNoneを返した場合(エラー発生時)
            return jsonify({"status": "error", "message": "Failed to generate receipt image"}), 500
    except Exception as e:
        print(f"Printing error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if p:
            p.close()

# ★★★ 変更なし: 元のコードを維持 (SSLContextもそのまま) ★★★
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, ssl_context=('cert.pem', 'key.pem'))