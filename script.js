document.addEventListener('DOMContentLoaded', () => {

    // --- 要素の取得 ---
    const folderTabs = document.getElementById('folder-tabs');
    const folderTabContent = document.getElementById('folder-tab-content');
    const selectedPromptsContainer = document.getElementById('selected-prompts-container');
    
    const addFolderBtn = document.getElementById('add-folder-btn');
    const saveDataBtn = document.getElementById('save-data-btn');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const clearSelectionHeaderBtn = document.getElementById('clear-selection-header-btn');
    
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');

    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const searchSuggestions = document.getElementById('search-suggestions');

    // --- データ管理 ---
    let state = {
        data: [],
        activeFolderId: null
    };

    const saveData = () => {
        try {
            localStorage.setItem('promptManagerData', JSON.stringify(state.data));
        } catch (e) {
            console.error('データの保存に失敗しました:', e);
            alert('データの保存に失敗しました。');
        }
    };

    const loadData = () => {
        const savedData = localStorage.getItem('promptManagerData');
        if (savedData) {
            try {
                state.data = JSON.parse(savedData);
            } catch (e) {
                console.error('データの読み込みに失敗しました:', e);
                state.data = getInitialData();
            }
        } else {
            state.data = getInitialData();
        }
        if (state.data.length > 0 && !state.activeFolderId) {
            state.activeFolderId = state.data[0].id;
        }
    };

    const getInitialData = () => {
        const now = Date.now();
        return [
            { id: `folder-${now}`, name: '品質', prompts: [
                { id: `prompt-${now+1}`, meaning: '最高品質', text: 'best quality', selected: false },
                { id: `prompt-${now+2}`, meaning: '傑作', text: 'masterpiece', selected: false },
                { id: `prompt-${now+3}`, meaning: '高解像度', text: 'highres', selected: false }
            ]},
            { id: `folder-${now+10}`, name: '身体つき', prompts: [
                { id: `prompt-${now+11}`, meaning: 'スレンダー', text: 'slender', selected: false },
                { id: `prompt-${now+12}`, meaning: 'むちむち', text: 'plump', selected: false },
                { id: `prompt-${now+13}`, meaning: '小柄', text: 'petite', selected: false }
            ]},
            { id: `folder-${now+20}`, name: '胸', prompts: [
                { id: `prompt-${now+21}`, meaning: '巨乳', text: 'large breasts', selected: false },
                { id: `prompt-${now+22}`, meaning: '普通胸', text: 'medium breasts', selected: false },
                { id: `prompt-${now+23}`, meaning: '貧乳', text: 'small breasts', selected: false }
            ]}
        ];
    };

    // --- 画面描画 ---
    const render = () => {
        // アクティブなタブが存在しない場合の補正
        if (state.data.length > 0 && !state.data.some(f => f.id === state.activeFolderId)) {
            state.activeFolderId = state.data[0].id;
        }

        // 1. タブの描画
        folderTabs.innerHTML = '';
        state.data.forEach(folder => {
            const selectedCount = folder.prompts.filter(p => p.selected).length;
            const isActive = folder.id === state.activeFolderId;

            const li = document.createElement('li');
            li.className = 'nav-item';
            li.dataset.folderId = folder.id;
            li.innerHTML = `
                <div class="nav-link ${isActive ? 'active' : ''}" data-folder-id="${folder.id}">
                    <i class="fas fa-grip-vertical folder-drag-handle" title="ドラッグしてタブを移動"></i>
                    <span class="tab-name">${folder.name}</span>
                    ${selectedCount > 0 ? `<span class="badge rounded-pill bg-primary">${selectedCount}</span>` : ''}
                </div>
            `;
            folderTabs.appendChild(li);
        });

        // 2. アクティブなタブの中身を描画
        folderTabContent.innerHTML = '';
        const activeFolder = state.data.find(f => f.id === state.activeFolderId);

        if (!activeFolder) {
            folderTabContent.innerHTML = '<p class="text-muted mb-0">「タブ追加」ボタンからカテゴリを作成してください。</p>';
        } else {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'd-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom gap-2';
            headerDiv.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <h5 class="mb-0 fw-bold">${activeFolder.name}</h5>
                    <button class="btn btn-sm btn-outline-secondary" data-action="edit-folder" title="タブ名を変更">
                        <i class="fas fa-edit"></i> 名前変更
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="delete-folder" title="このタブを削除">
                        <i class="fas fa-trash-alt"></i> タブ削除
                    </button>
                </div>
                <button class="btn btn-sm btn-primary" data-action="add-prompt">
                    <i class="fas fa-plus"></i> プロンプト追加
                </button>
            `;
            folderTabContent.appendChild(headerDiv);

            const gridDiv = document.createElement('div');
            gridDiv.className = 'prompt-grid';
            gridDiv.id = 'active-prompt-grid';

            if (activeFolder.prompts.length === 0) {
                gridDiv.innerHTML = '<p class="text-muted mb-0">プロンプトがまだありません。「プロンプト追加」から登録してください。</p>';
            } else {
                activeFolder.prompts.forEach(prompt => {
                    const chip = document.createElement('div');
                    chip.className = `prompt-chip ${prompt.selected ? 'selected' : ''}`;
                    chip.dataset.promptId = prompt.id;
                    chip.innerHTML = `
                        <i class="fas fa-grip-vertical prompt-drag-handle" title="ドラッグで並び替え"></i>
                        <div>
                            <div class="chip-meaning">${prompt.meaning}</div>
                            <div class="chip-text">${prompt.text}</div>
                        </div>
                        <i class="fas fa-times delete-chip-btn ms-1" data-action="delete-prompt" title="削除"></i>
                    `;
                    gridDiv.appendChild(chip);
                });
            }
            folderTabContent.appendChild(gridDiv);
        }

        updateSelectedPromptsArea();
        initSortable();
    };

    // 選択中プロンプトの表示更新
    const updateSelectedPromptsArea = () => {
        const selectedPrompts = state.data.flatMap(f => f.prompts).filter(p => p.selected).map(p => p.text);
        if (selectedPrompts.length > 0) {
            selectedPromptsContainer.textContent = selectedPrompts.join(', ') + ', ';
        } else {
            selectedPromptsContainer.innerHTML = '<span class="text-white-50">プロンプトを選択してください...</span>';
        }
    };

    // 並び替え（SortableJS）の初期化
    const initSortable = () => {
        if (folderTabs.sortable) folderTabs.sortable.destroy();
        folderTabs.sortable = new Sortable(folderTabs, {
            handle: '.folder-drag-handle',
            animation: 150,
            onEnd: (evt) => {
                const [movedItem] = state.data.splice(evt.oldDraggableIndex, 1);
                state.data.splice(evt.newDraggableIndex, 0, movedItem);
                saveData();
            }
        });

        const grid = document.getElementById('active-prompt-grid');
        if (grid && state.data.find(f => f.id === state.activeFolderId)?.prompts.length > 0) {
            new Sortable(grid, {
                handle: '.prompt-drag-handle',
                animation: 150,
                onEnd: (evt) => {
                    const folder = state.data.find(f => f.id === state.activeFolderId);
                    if (folder) {
                        const [movedPrompt] = folder.prompts.splice(evt.oldDraggableIndex, 1);
                        folder.prompts.splice(evt.newDraggableIndex, 0, movedPrompt);
                        saveData();
                    }
                }
            });
        }
    };

    // --- 一括選択解除 ---
    const clearAllSelections = () => {
        const hasSelected = state.data.some(f => f.prompts.some(p => p.selected));
        if (!hasSelected) return;

        state.data.forEach(folder => {
            folder.prompts.forEach(prompt => prompt.selected = false);
        });
        render();
        saveData();
        if (!searchSuggestions.classList.contains('d-none')) {
            renderSearchSuggestions(searchInput.value);
        }
    };

    clearSelectionBtn.addEventListener('click', clearAllSelections);
    clearSelectionHeaderBtn.addEventListener('click', clearAllSelections);

    // --- タブ切り替えイベント ---
    folderTabs.addEventListener('click', (e) => {
        if (e.target.closest('.folder-drag-handle')) return;
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            state.activeFolderId = navLink.dataset.folderId;
            render();
        }
    });

    // --- タブ内の操作（追加・編集・削除・選択切り替え） ---
    folderTabContent.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('.prompt-drag-handle')) return;

        const actionBtn = target.closest('[data-action]');
        const action = actionBtn ? actionBtn.dataset.action : null;
        const activeFolder = state.data.find(f => f.id === state.activeFolderId);
        if (!activeFolder) return;

        if (action === 'add-prompt') {
            const meaning = prompt('プロンプトの意味（日本語など）:');
            if (meaning) {
                const text = prompt('プロンプト（英語など）:');
                if (text) {
                    activeFolder.prompts.push({
                        id: `prompt-${Date.now()}`,
                        meaning: meaning.trim(),
                        text: text.trim(),
                        selected: false
                    });
                    render();
                    saveData();
                }
            }
        } else if (action === 'edit-folder') {
            const newName = prompt('新しいタブ名を入力してください:', activeFolder.name);
            if (newName && newName.trim() !== '') {
                activeFolder.name = newName.trim();
                render();
                saveData();
            }
        } else if (action === 'delete-folder') {
            if (confirm(`タブ「${activeFolder.name}」と中のプロンプトをすべて削除しますか？`)) {
                state.data = state.data.filter(f => f.id !== activeFolder.id);
                state.activeFolderId = state.data.length > 0 ? state.data[0].id : null;
                render();
                saveData();
            }
        } else if (action === 'delete-prompt') {
            e.stopPropagation();
            const chip = target.closest('.prompt-chip');
            const promptId = chip.dataset.promptId;
            if (confirm('このプロンプトを削除しますか？')) {
                activeFolder.prompts = activeFolder.prompts.filter(p => p.id !== promptId);
                render();
                saveData();
            }
        } else {
            // チップ本体をクリックしたときは選択ON/OFFを切り替え
            const chip = target.closest('.prompt-chip');
            if (chip) {
                const promptId = chip.dataset.promptId;
                const promptItem = activeFolder.prompts.find(p => p.id === promptId);
                if (promptItem) {
                    promptItem.selected = !promptItem.selected;
                    render();
                    saveData();
                }
            }
        }
    });

    // --- 検索＆サジェスト機能（「これ？」候補表示） ---
    const renderSearchSuggestions = (keyword) => {
        const query = keyword.trim().toLowerCase();
        if (!query) {
            searchSuggestions.classList.add('d-none');
            searchClearBtn.classList.add('d-none');
            return;
        }
        searchClearBtn.classList.remove('d-none');

        const matches = [];
        state.data.forEach(folder => {
            folder.prompts.forEach(prompt => {
                if (prompt.meaning.toLowerCase().includes(query) || prompt.text.toLowerCase().includes(query) || folder.name.toLowerCase().includes(query)) {
                    matches.push({ folder, prompt });
                }
            });
        });

        searchSuggestions.innerHTML = '';
        if (matches.length === 0) {
            searchSuggestions.innerHTML = `<div class="list-group-item text-muted small">「${keyword}」に一致するプロンプトはありません</div>`;
        } else {
            const header = document.createElement('div');
            header.className = 'list-group-item bg-light py-1 px-3 small text-muted fw-bold';
            header.textContent = `候補（クリックで選択 / 解除） - ${matches.length}件ヒット`;
            searchSuggestions.appendChild(header);

            matches.forEach(({ folder, prompt }) => {
                const item = document.createElement('div');
                item.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center suggestion-item ${prompt.selected ? 'list-group-item-primary' : ''}`;
                item.dataset.folderId = folder.id;
                item.dataset.promptId = prompt.id;
                item.innerHTML = `
                    <div>
                        <span class="badge bg-secondary me-2">${folder.name}</span>
                        <span class="fw-bold me-2">${prompt.meaning}</span>
                        <small class="text-muted font-monospace">${prompt.text}</small>
                    </div>
                    <div>
                        <span class="badge ${prompt.selected ? 'bg-primary' : 'bg-outline-secondary text-dark border'}">
                            ${prompt.selected ? '<i class="fas fa-check"></i> 選択中' : '選択する'}
                        </span>
                    </div>
                `;
                searchSuggestions.appendChild(item);
            });
        }
        searchSuggestions.classList.remove('d-none');
    };

    searchInput.addEventListener('input', (e) => {
        renderSearchSuggestions(e.target.value);
    });

    searchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim() !== '') {
            renderSearchSuggestions(e.target.value);
        }
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchSuggestions.classList.add('d-none');
        searchClearBtn.classList.add('d-none');
        searchInput.focus();
    });

    // 検索候補をクリックしたときの動作
    searchSuggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;

        const folderId = item.dataset.folderId;
        const promptId = item.dataset.promptId;
        const folder = state.data.find(f => f.id === folderId);
        if (folder) {
            const promptItem = folder.prompts.find(p => p.id === promptId);
            if (promptItem) {
                promptItem.selected = !promptItem.selected;
                state.activeFolderId = folder.id; // そのプロンプトがあるタブに自動で移動
                render();
                saveData();
                renderSearchSuggestions(searchInput.value); // 候補リスト側の表示も更新
            }
        }
    });

    // 検索窓の外側をクリックしたら候補を閉じる
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-input') && !e.target.closest('#search-suggestions') && !e.target.closest('#search-clear-btn')) {
            searchSuggestions.classList.add('d-none');
        }
    });

    // --- フォルダ（タブ）追加・保存・エクスポート・インポート ---
    addFolderBtn.addEventListener('click', () => {
        const folderName = prompt('新しいタブ（カテゴリ）名を入力してください:', '新しいタブ');
        if (folderName && folderName.trim() !== '') {
            const newFolder = {
                id: `folder-${Date.now()}`,
                name: folderName.trim(),
                prompts: []
            };
            state.data.push(newFolder);
            state.activeFolderId = newFolder.id;
            render();
            saveData();
        }
    });

    saveDataBtn.addEventListener('click', () => {
        saveData();
        alert('データを手動で保存しました。');
    });

    exportBtn.addEventListener('click', () => {
        const exportData = JSON.parse(JSON.stringify(state.data));
        exportData.forEach(folder => {
            folder.prompts.forEach(prompt => prompt.selected = false);
        });

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-prompts.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('現在のプロンプトデータは上書きされます。よろしいですか？')) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    state.data = importedData;
                    state.activeFolderId = state.data.length > 0 ? state.data[0].id : null;
                    render();
                    saveData();
                    alert('データをインポートしました。');
                } else {
                    throw new Error('Invalid format');
                }
            } catch (error) {
                alert('ファイルの読み込みに失敗しました。有効なJSONファイルを選択してください。');
            } finally {
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    });

    // --- 選択中プロンプトのワンクリックコピー ---
    selectedPromptsContainer.addEventListener('click', () => {
        const textToCopy = selectedPromptsContainer.textContent;
        if (textToCopy && !selectedPromptsContainer.querySelector('.text-white-50')) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const originalText = selectedPromptsContainer.textContent;
                    selectedPromptsContainer.innerHTML = '<span class="text-warning fw-bold"><i class="fas fa-check"></i> コピーしました！</span>';
                    setTimeout(() => {
                        selectedPromptsContainer.textContent = originalText;
                    }, 1200);
                })
                .catch(err => {
                    console.error('コピーに失敗しました:', err);
                    alert('コピーに失敗しました。');
                });
        }
    });

    // 初期実行
    loadData();
    render();
});