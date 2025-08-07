// ページのHTMLがすべて読み込まれたら、中の処理を実行する
document.addEventListener('DOMContentLoaded', () => {

    // --- 変数定義：HTMLの要素を取得 ---
    const promptListContainer = document.getElementById('prompt-list-container');
    const selectedPromptsContainer = document.getElementById('selected-prompts-container');
    const addFolderBtn = document.getElementById('add-folder-btn');
    const saveDataBtn = document.getElementById('save-data-btn');
    const resetDataBtn = document.getElementById('reset-data-btn');
    // 👇 追加
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');


    // --- データ管理 ---
    let state = {
        data: []
    };

    const saveData = () => {
        try {
            localStorage.setItem('promptManagerData', JSON.stringify(state.data));
        } catch (e) { console.error('データの保存に失敗しました:', e); alert('データの保存に失敗しました。'); }
    };

    const loadData = () => {
        const savedData = localStorage.getItem('promptManagerData');
        if (savedData) {
            try { state.data = JSON.parse(savedData); } catch (e) { console.error('データの読み込みに失敗しました:', e); state.data = getInitialData(); }
        } else { state.data = getInitialData(); }
    };

    const getInitialData = () => {
        return [
            { id: `folder-${Date.now()}`, name: '品質 (Quality)', isOpen: true, prompts: [
                { id: `prompt-${Date.now()+1}`, meaning: '最高品質', text: 'best quality', selected: false },
                { id: `prompt-${Date.now()+2}`, meaning: '傑作', text: 'masterpiece', selected: false },
            ]},
            { id: `folder-${Date.now()+4}`, name: 'キャラクター (Character)', isOpen: false, prompts: [
                { id: `prompt-${Date.now()+5}`, meaning: '一人の女の子', text: '1girl', selected: false },
                { id: `prompt-${Date.now()+6}`, meaning: '銀髪', text: 'silver hair', selected: false },
            ]}
        ];
    };

    // --- 画面描画（レンダリング）関数 ---
    const render = () => {
        promptListContainer.innerHTML = '';
        state.data.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'accordion-item mb-3';
            folderElement.dataset.folderId = folder.id;
            folderElement.innerHTML = `
                <h2 class="accordion-header" id="heading-${folder.id}">
                    <div class="d-flex align-items-center folder-drag-handle">
                        <button class="accordion-button ${folder.isOpen ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${folder.id}" aria-expanded="${folder.isOpen}" aria-controls="collapse-${folder.id}">
                            <span class="folder-title me-auto" data-folder-id="${folder.id}">${folder.name}</span>
                            <i class="fas fa-edit action-btn me-2" data-action="edit-folder" title="フォルダ名編集"></i>
                            <i class="fas fa-trash-alt action-btn me-2" data-action="delete-folder" title="フォルダ削除"></i>
                            <i class="fas fa-plus action-btn" data-action="add-prompt" title="プロンプト追加"></i>
                        </button>
                    </div>
                </h2>
                <div id="collapse-${folder.id}" class="accordion-collapse collapse ${folder.isOpen ? 'show' : ''}" aria-labelledby="heading-${folder.id}">
                    <div class="accordion-body p-0">
                        <table class="table table-hover prompt-table mb-0">
                            <thead>
                                <tr>
                                    <th style="width: 5%;"></th>
                                    <th style="width: 5%;" class="prompt-drag-handle"><i class="fas fa-grip-vertical"></i></th>
                                    <th style="width: 38%;">意味</th>
                                    <th style="width: 42%;">プロンプト</th>
                                    <th style="width: 10%;"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${folder.prompts.map(prompt => `
                                    <tr data-prompt-id="${prompt.id}" data-folder-id="${folder.id}" class="${prompt.selected ? 'table-primary' : ''}">
                                        <td><input class="form-check-input" type="checkbox" ${prompt.selected ? 'checked' : ''}></td>
                                        <td class="prompt-drag-handle"><i class="fas fa-grip-vertical"></i></td>
                                        <td>${prompt.meaning}</td>
                                        <td>${prompt.text}</td>
                                        <td><i class="fas fa-trash-alt action-btn" data-action="delete-prompt" title="プロンプト削除"></i></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
            promptListContainer.appendChild(folderElement);
        });
        updateSelectedPromptsArea();
        initSortable();
    };
    
    const updateSelectedPromptsArea = () => {
        const selectedPrompts = state.data.flatMap(f => f.prompts).filter(p => p.selected).map(p => p.text);
        if (selectedPrompts.length > 0) {
            selectedPromptsContainer.textContent = selectedPrompts.join(', ') + ', ';
        } else {
            selectedPromptsContainer.innerHTML = '<span class="text-muted">プロンプトを選択してください...</span>';
        }
    };

    const initSortable = () => {
        new Sortable(promptListContainer, {
            handle: '.folder-drag-handle', animation: 150,
            onEnd: (evt) => {
                const [movedItem] = state.data.splice(evt.oldDraggableIndex, 1);
                state.data.splice(evt.newDraggableIndex, 0, movedItem);
                saveData();
            },
        });
        document.querySelectorAll('.prompt-table tbody').forEach(tbody => {
            if (tbody.sortable) tbody.sortable.destroy();
            tbody.sortable = new Sortable(tbody, {
                handle: '.prompt-drag-handle', animation: 150,
                onEnd: (evt) => {
                    const folderId = evt.item.dataset.folderId;
                    const folder = state.data.find(f => f.id === folderId);
                    if (folder) {
                        const [movedPrompt] = folder.prompts.splice(evt.oldDraggableIndex, 1);
                        folder.prompts.splice(evt.newDraggableIndex, 0, movedPrompt);
                        saveData();
                    }
                },
            });
        });
    };
    
    // --- イベントリスナー設定 ---
    
    addFolderBtn.addEventListener('click', () => {
        const folderName = prompt('新しいフォルダ名を入力してください:', '新しいフォルダ');
        if (folderName) {
            state.data.unshift({ id: `folder-${Date.now()}`, name: folderName, isOpen: true, prompts: [] });
            render(); saveData();
        }
    });

    saveDataBtn.addEventListener('click', () => { saveData(); alert('データを手動で保存しました。'); });

    resetDataBtn.addEventListener('click', () => {
        if (confirm('本当にすべてのデータをリセットしますか？この操作は元に戻せません。')) {
            localStorage.removeItem('promptManagerData');
            loadData(); render();
        }
    });

    // 👇 ここからエクスポート/インポートのイベントリスナーを追加
    exportBtn.addEventListener('click', () => {
        // 選択状態を解除したデータを作成（エクスポートファイルがクリーンになるように）
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
        alert('プロンプトデータをエクスポートしました。');
    });

    importBtn.addEventListener('click', () => {
        importFileInput.click(); // 非表示のinput要素をクリックさせる
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('現在のプロンプトデータは上書きされます。よろしいですか？')) {
            e.target.value = ''; // 次回同じファイルを選択できるようにリセット
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) { // 簡単な形式チェック
                    state.data = importedData;
                    render();
                    saveData();
                    alert('データをインポートしました。');
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                alert('ファイルの読み込みに失敗しました。有効なJSONファイルを選択してください。');
                console.error('インポートエラー:', error);
            } finally {
                e.target.value = ''; // 処理後リセット
            }
        };
        reader.readAsText(file);
    });
    // 👆 ここまで追加

    promptListContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('.prompt-drag-handle')) return;

        const action = target.dataset.action;
        const promptRow = target.closest('tr');
        const folderHeader = target.closest('.accordion-header');
        
        // アコーディオンの開閉状態を保存
        if (folderHeader && !target.closest('.action-btn') && !target.closest('.folder-title')) {
            const folderId = folderHeader.querySelector('.folder-title').dataset.folderId;
            const folder = state.data.find(f => f.id === folderId);
            if (folder) {
                setTimeout(() => {
                    folder.isOpen = folderHeader.querySelector('.accordion-button').getAttribute('aria-expanded') === 'true';
                    saveData();
                }, 350);
            }
        }
        
        if (action === 'add-prompt') {
            e.stopPropagation();
            const folderId = target.closest('.accordion-header').querySelector('.folder-title').dataset.folderId;
            const meaning = prompt('プロンプトの意味（日本語など）:');
            if (meaning) {
                const text = prompt('プロンプト（英語など）:');
                if (text) {
                    const folder = state.data.find(f => f.id === folderId);
                    if (folder) {
                        folder.prompts.push({ id: `prompt-${Date.now()}`, meaning, text, selected: false });
                        render(); saveData();
                    }
                }
            }
        } else if (action === 'delete-prompt') {
            e.stopPropagation();
            if (confirm('このプロンプトを削除しますか？')) {
                const promptId = promptRow.dataset.promptId;
                const folderId = promptRow.dataset.folderId;
                const folder = state.data.find(f => f.id === folderId);
                if (folder) {
                    folder.prompts = folder.prompts.filter(p => p.id !== promptId);
                    render(); saveData();
                }
            }
        } else if (action === 'delete-folder') {
            e.stopPropagation();
            if (confirm('このフォルダと中のプロンプトをすべて削除しますか？')) {
                const folderId = target.closest('.accordion-header').querySelector('.folder-title').dataset.folderId;
                state.data = state.data.filter(f => f.id !== folderId);
                render(); saveData();
            }
        } else if (action === 'edit-folder') {
            e.stopPropagation();
            const folderTitle = target.closest('.accordion-header').querySelector('.folder-title');
            folderTitle.contentEditable = true; folderTitle.focus();
            const finishEdit = () => {
                folderTitle.contentEditable = false;
                const folder = state.data.find(f => f.id === folderTitle.dataset.folderId);
                if (folder && folder.name !== folderTitle.textContent.trim()) {
                    folder.name = folderTitle.textContent.trim();
                    saveData();
                }
            };
            folderTitle.addEventListener('blur', finishEdit, { once: true });
            folderTitle.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); folderTitle.blur(); } });
        } else if (promptRow) {
            const promptId = promptRow.dataset.promptId;
            const folderId = promptRow.dataset.folderId;
            const folder = state.data.find(f => f.id === folderId);
            const prompt = folder.prompts.find(p => p.id === promptId);
            if (prompt) {
                prompt.selected = !prompt.selected;
                // 選択状態の反映はrender()に任せるのではなく、直接クラスを切り替える方が高速
                promptRow.classList.toggle('table-primary');
                promptRow.querySelector('input[type="checkbox"]').checked = prompt.selected;
                updateSelectedPromptsArea();
                saveData(); // データだけ保存
            }
        }
    });

    selectedPromptsContainer.addEventListener('click', () => {
        const textToCopy = selectedPromptsContainer.textContent;
        if (textToCopy && !selectedPromptsContainer.querySelector('.text-muted')) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const originalText = selectedPromptsContainer.textContent;
                    selectedPromptsContainer.textContent = 'コピーしました！';
                    setTimeout(() => { selectedPromptsContainer.textContent = originalText; }, 1500);
                })
                .catch(err => { console.error('コピーに失敗しました:', err); alert('コピーに失敗しました。'); });
        }
    });

    loadData();
    render();
});