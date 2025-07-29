// js/views/AbstractView.js (新規作成)

export default class {
    constructor(params) {
        this.params = params;
    }

    setTitle(title) {
        document.title = title;
    }

    async getHtml() {
        return "";
    }

    // afterRenderは、各ビューでDOMがレンダリングされた後に実行したい
    // イベントリスナーの設定などに使うためのものです。
    // 各ビューで必要に応じてこのメソッドを実装します。
    afterRender() {
        // デフォルトでは何もしない
    }

    // destroyは、ビューが切り替わる際に不要なイベントリスナーや
    // タイマーをクリーンアップするために使います。
    destroy() {
        // デフォルトでは何もしない
    }
}