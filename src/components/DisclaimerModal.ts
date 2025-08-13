/**
 * 免責事項モーダルコンポーネント
 */
export class DisclaimerModal {
  private modal: HTMLElement | null = null
  private content: HTMLElement | null = null
  private isLoaded = false

  constructor() {
    this.setupElements()
    this.bindEvents()
  }

  /**
   * DOM要素の取得・設定
   */
  private setupElements(): void {
    this.modal = document.getElementById('disclaimer-modal')
    this.content = document.getElementById('disclaimer-content')

    if (!this.modal || !this.content) {
      console.error('❌ 免責事項モーダル要素が見つかりません')
      return
    }
  }

  /**
   * イベントリスナーのバインド
   */
  private bindEvents(): void {
    // 免責事項リンククリック
    const disclaimerLink = document.getElementById('disclaimer-link')
    disclaimerLink?.addEventListener('click', (e) => {
      e.preventDefault()
      this.show()
    })

    // モーダル閉じるボタン
    const closeButton = document.getElementById('disclaimer-close')
    closeButton?.addEventListener('click', () => {
      this.hide()
    })

    // 理解しましたボタン
    const agreeButton = document.getElementById('disclaimer-agree')
    agreeButton?.addEventListener('click', () => {
      this.hide()
    })

    // モーダル背景クリックで閉じる
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide()
      }
    })

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide()
      }
    })
  }

  /**
   * モーダル表示
   */
  async show(): Promise<void> {
    if (!this.modal) return

    // 免責事項をロード（初回のみ）
    if (!this.isLoaded) {
      await this.loadDisclaimer()
    }

    this.modal.style.display = 'flex'
    document.body.style.overflow = 'hidden' // スクロール無効化
    
    // フォーカス管理
    const closeButton = document.getElementById('disclaimer-close')
    closeButton?.focus()
  }

  /**
   * モーダル非表示
   */
  hide(): void {
    if (!this.modal) return

    this.modal.style.display = 'none'
    document.body.style.overflow = '' // スクロール復活
  }

  /**
   * モーダルが表示されているか
   */
  private isVisible(): boolean {
    return this.modal?.style.display === 'flex'
  }

  /**
   * 免責事項の内容を読み込み
   */
  private async loadDisclaimer(): Promise<void> {
    if (!this.content) return

    try {
      // Markdownファイルを読み込み
      const response = await fetch('./disclaimer.md')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const markdownText = await response.text()
      
      // MarkdownをHTMLに変換（簡易版）
      const htmlContent = this.convertMarkdownToHtml(markdownText)
      
      this.content.innerHTML = htmlContent
      this.isLoaded = true

      console.log('✅ 免責事項を読み込みました')
    } catch (error) {
      console.error('❌ 免責事項の読み込みに失敗:', error)
      
      // フォールバック表示
      this.content.innerHTML = `
        <div class="error-message">
          <h3>免責事項の読み込みに失敗しました</h3>
          <p>申し訳ございませんが、免責事項を表示できません。</p>
          <p>以下の点をご理解のうえ、本ツールをご利用ください：</p>
          <ul>
            <li><strong>本ツールは教育・研究目的のシミュレーションツールです</strong></li>
            <li><strong>投資アドバイスの提供ではありません</strong></li>
            <li><strong>計算結果は理論的な試算であり、実際の投資結果を保証するものではありません</strong></li>
            <li><strong>投資判断は必ず自己責任で行ってください</strong></li>
            <li><strong>投資に関するリスクを十分理解のうえご利用ください</strong></li>
          </ul>
          <p>詳細な免責事項については、GitHubリポジトリをご確認ください。</p>
        </div>
      `
    }
  }

  /**
   * 簡易Markdown→HTML変換
   */
  private convertMarkdownToHtml(markdown: string): string {
    let html = markdown

    // エスケープ処理
    html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')

    // 見出し変換
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

    // 太字変換
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // リスト変換
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    
    // 段落変換
    html = html.replace(/\n\n/g, '</p><p>')
    html = '<p>' + html + '</p>'
    
    // 空段落除去
    html = html.replace(/<p><\/p>/g, '')
    html = html.replace(/<p>(<h[1-6])/g, '$1')
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    html = html.replace(/<p>(<ul>)/g, '$1')
    html = html.replace(/(<\/ul>)<\/p>/g, '$1')

    // 水平線
    html = html.replace(/^---$/gm, '<hr>')

    return html
  }

  /**
   * 初回アクセス時の同意確認
   */
  checkFirstVisit(): void {
    const hasAgreed = localStorage.getItem('snowball_map_disclaimer_agreed')
    
    if (!hasAgreed) {
      // 初回訪問時は自動で免責事項を表示
      setTimeout(() => {
        this.show()
      }, 1000) // 1秒後に表示
    }
  }

  /**
   * 同意状態を保存
   */
  markAsAgreed(): void {
    localStorage.setItem('snowball_map_disclaimer_agreed', 'true')
    localStorage.setItem('snowball_map_disclaimer_agreed_date', new Date().toISOString())
  }

  /**
   * コンポーネント破棄
   */
  destroy(): void {
    // イベントリスナーの除去は自動的に行われる（要素削除時）
    this.modal = null
    this.content = null
  }
}