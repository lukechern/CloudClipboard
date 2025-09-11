// 标签系统配置文件
const TagConfig = {
    // 常用标签配置
    commonTags: [
        '工作',
        '生活', 
        '学习',
        '重要',
        '待办',
        '项目',
        '默认tag'
    ],
    
    // 标签过滤器配置
    filterConfig: {
        showAll: true,
        defaultFilter: 'all'
    },
    
    // 标签样式配置
    styleConfig: {
        maxTagLength: 20,
        buttonClass: 'tag-btn-unified',
        activeClass: 'active'
    },
    
    // 获取常用标签
    getCommonTags() {
        return [...this.commonTags];
    },
    
    // 添加常用标签
    addCommonTag(tag) {
        if (!this.commonTags.includes(tag) && tag.trim()) {
            this.commonTags.push(tag.trim());
            return true;
        }
        return false;
    },
    
    // 移除常用标签
    removeCommonTag(tag) {
        const index = this.commonTags.indexOf(tag);
        if (index > -1) {
            this.commonTags.splice(index, 1);
            return true;
        }
        return false;
    }
};

// 导出配置对象
window.TagConfig = TagConfig;

// 全局标签管理器
const TagManager = {
    // 存储所有已存在的标签
    existingTags: new Set(),
    
    // 初始化标签管理器
    init() {
        console.log('TagManager 已初始化');
        this.loadExistingTags();
    },
    
    // 从记录数据中加载已存在的标签
    loadExistingTags() {
        if (window.recordsData) {
            window.recordsData.forEach(record => {
                if (record.tag_7ree && record.tag_7ree !== '默认tag') {
                    this.existingTags.add(record.tag_7ree);
                }
            });
        }
    },
    
    // 添加新标签到已存在标签集合
    addExistingTag(tag) {
        if (tag && tag.trim() && tag !== '默认tag') {
            this.existingTags.add(tag.trim());
        }
    },
    
    // 获取所有已存在的标签
    getExistingTags() {
        return Array.from(this.existingTags).sort();
    },
    
    // 获取建议标签（常用标签 + 已存在标签）
    getSuggestedTags() {
        const commonTags = TagConfig.getCommonTags();
        const existingTags = this.getExistingTags();
        
        // 合并并去重，常用标签优先
        const allTags = [...commonTags];
        existingTags.forEach(tag => {
            if (!allTags.includes(tag)) {
                allTags.push(tag);
            }
        });
        
        return allTags;
    },
    
    // 更新标签过滤器按钮
    updateTagFilterButtons(records = []) {
        const container = document.getElementById('tagFilterButtons_7ree');
        if (!container) return;
        
        // 从记录中提取所有标签
        const tagsInRecords = new Set();
        records.forEach(record => {
            if (record.tag_7ree && record.tag_7ree !== '默认tag') {
                tagsInRecords.add(record.tag_7ree);
            }
        });
        
        // 清空现有按钮（保留"全部"按钮）
        const allButton = container.querySelector('.tag-filter-btn-7ree[data-tag="all"]');
        container.innerHTML = '';
        if (allButton) {
            container.appendChild(allButton);
        } else {
            // 如果没有"全部"按钮，创建一个
            const allBtn = document.createElement('button');
            allBtn.className = 'tag-filter-btn-7ree active';
            allBtn.textContent = '全部';
            allBtn.setAttribute('data-tag', 'all');
            allBtn.onclick = () => this.filterByTag('all');
            container.appendChild(allBtn);
        }
        
        // 添加标签按钮
        Array.from(tagsInRecords).sort().forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-filter-btn-7ree';
            btn.textContent = tag;
            btn.setAttribute('data-tag', tag);
            btn.onclick = () => this.filterByTag(tag);
            container.appendChild(btn);
        });
    },
    
    // 按标签过滤
    filterByTag(tag) {
        // 更新按钮状态
        document.querySelectorAll('.tag-filter-btn-7ree').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.tag-filter-btn-7ree[data-tag="${tag}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // 调用现有的过滤功能
        if (typeof tagFilter_7ree !== 'undefined' && tagFilter_7ree.filterByTag) {
            tagFilter_7ree.filterByTag(tag);
        }
    }
};

// 导出标签管理器
window.TagManager = TagManager;

console.log('标签配置文件已加载');