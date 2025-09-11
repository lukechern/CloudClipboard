// Tag筛选功能组件
class TagFilter_7ree {
    constructor() {
        this.currentTag = 'all';
        this.availableTags = new Set(['默认tag']);
        this.init();
    }

    // 初始化
    init() {
        this.bindEvents();
        // 设置全局变量供其他模块使用
        window.currentTagFilter_7ree = this.currentTag;
    }

    // 绑定事件
    bindEvents() {
        const container = document.getElementById('tagFilterButtons_7ree');
        if (container) {
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-filter-btn-7ree')) {
                    const tag = e.target.dataset.tag;
                    this.selectTag(tag);
                }
            });
        }
    }

    // 选择标签
    selectTag(tag) {
        if (this.currentTag === tag) return;
        
        this.currentTag = tag;
        window.currentTagFilter_7ree = tag;
        
        // 更新按钮状态
        this.updateButtonStates();
        
        // 重新加载记录
        this.reloadRecords();
    }

    // 更新按钮状态
    updateButtonStates() {
        const buttons = document.querySelectorAll('.tag-filter-btn-7ree');
        buttons.forEach(btn => {
            if (btn.dataset.tag === this.currentTag) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 重新加载记录
    reloadRecords() {
        // 获取当前的存档筛选状态
        const currentFilter = window.currentFilter || 'cache';
        
        // 调用loadRecords函数，传入当前的存档筛选和标签筛选
        if (typeof loadRecords === 'function') {
            loadRecords(currentFilter, this.currentTag);
        }
    }

    // 从记录数据中提取所有标签
    extractTagsFromRecords(records) {
        const tags = new Set(['默认tag']);
        
        if (Array.isArray(records)) {
            records.forEach(record => {
                if (record.tag_7ree && record.tag_7ree.trim()) {
                    tags.add(record.tag_7ree.trim());
                } else {
                    tags.add('默认tag');
                }
            });
        }
        
        return Array.from(tags).sort();
    }

    // 更新标签按钮
    updateTagButtons(records) {
        // 如果有TagManager，优先使用TagManager的功能
        if (window.TagManager && typeof window.TagManager.updateTagFilterButtons === 'function') {
            // 更新TagManager中的已存在标签
            if (Array.isArray(records)) {
                records.forEach(record => {
                    if (record.tag_7ree && record.tag_7ree !== '默认tag') {
                        window.TagManager.addExistingTag(record.tag_7ree);
                    }
                });
            }
            
            // 使用TagManager更新按钮
            window.TagManager.updateTagFilterButtons(records);
            
            // 恢复选中状态
            this.updateButtonStates();
            return;
        }
        
        // 原有逻辑保持不变
        const tags = this.extractTagsFromRecords(records);
        const container = document.getElementById('tagFilterButtons_7ree');
        
        if (!container) return;
        
        // 保存当前选中的标签
        const currentTag = this.currentTag;
        
        // 清空现有按钮（除了"全部"按钮）
        const allButton = container.querySelector('[data-tag="all"]');
        container.innerHTML = '';
        
        // 重新添加"全部"按钮
        if (allButton) {
            container.appendChild(allButton);
        } else {
            const allBtn = document.createElement('button');
            allBtn.className = 'tag-filter-btn-7ree';
            allBtn.dataset.tag = 'all';
            allBtn.textContent = '全部';
            container.appendChild(allBtn);
        }
        
        // 添加标签按钮
        tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-filter-btn-7ree';
            btn.dataset.tag = tag;
            btn.textContent = tag === '默认tag' ? '默认TAG' : tag;
            container.appendChild(btn);
        });
        
        // 恢复选中状态
        this.currentTag = currentTag;
        this.updateButtonStates();
        
        // 更新可用标签集合
        this.availableTags = new Set(tags);
    }

    // 获取当前选中的标签
    getCurrentTag() {
        return this.currentTag;
    }

    // 检查记录是否匹配当前标签筛选
    matchesCurrentFilter(record) {
        if (this.currentTag === 'all') {
            return true;
        }
        
        const recordTag = record.tag_7ree || '默认tag';
        return recordTag === this.currentTag;
    }

    // 筛选记录
    filterRecords(records) {
        if (!Array.isArray(records)) {
            return records;
        }
        
        if (this.currentTag === 'all') {
            return records;
        }
        
        return records.filter(record => {
            const recordTag = record.tag_7ree || '默认tag';
            return recordTag === this.currentTag;
        });
    }

    // 重置到"全部"标签
    resetToAll() {
        this.selectTag('all');
    }
}

// 创建全局实例
const tagFilter_7ree = new TagFilter_7ree();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TagFilter_7ree;
}