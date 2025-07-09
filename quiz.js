document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');

    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const startButton = document.getElementById('start-button');

    const currentQuestionEl = document.getElementById('current-question');
    const totalQuestionsEl = document.getElementById('total-questions');
    const productItemDetails = document.getElementById('product-item-details');
    const menuOptions = document.getElementById('menu-options');
    const notesInput = document.getElementById('notes-input');

    const prevButton = document.getElementById('prev-button');
    const saveButton = document.getElementById('save-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    const nextButton = document.getElementById('next-button');
    const skipQuestionInput = document.getElementById('skip-question');
    const skipButton = document.getElementById('skip-button');

    const downloadButton = document.getElementById('download-results');
    const restartButton = document.getElementById('restart-button');
    const startNewButton = document.getElementById('start-new-button');

    // State
    let quizData = [];
    let currentQuestionIndex = 0;
    let userResponses = [];
    let selectedMenuItems = {};
    let totalQuestions = 0;

    // Initialize
    showScreen(welcomeScreen);
    console.log("Loading quiz data...");
    loadQuizData()
        .then(() => {
            console.log(`Loaded ${quizData.length} questions`);
            initializeQuiz();
        })
        .catch(error => {
            console.error('Error loading quiz data:', error);
            alert('Failed to load quiz questions. Please check your CSV file and try again.');
        });

    // Event listeners
    startButton.addEventListener('click', startQuiz);
    prevButton.addEventListener('click', () => {
        goToPreviousQuestion();
        window.scrollTo(0, 0);
    });
    saveButton.addEventListener('click', () => {
        saveCurrentResponse();
        window.scrollTo(0, 0);
        goToNextQuestion();
    });
    exportCsvButton.addEventListener('click', () => {
        saveCurrentResponse();
        downloadResults();
    });
    nextButton.addEventListener('click', () => {
        if (userResponses[currentQuestionIndex] && !userResponses[currentQuestionIndex].isSaved) {
            if (confirm('You have unsaved changes. Save before proceeding?')) {
                saveCurrentResponse();
                if (userResponses[currentQuestionIndex] && userResponses[currentQuestionIndex].isSaved) {
                    goToNextQuestion();
                }
            } else {
                goToNextQuestion();
            }
        } else {
            goToNextQuestion();
        }
        window.scrollTo(0, 0);
    });
    downloadButton.addEventListener('click', downloadResults);
    restartButton.addEventListener('click', restartQuiz);
    skipButton.addEventListener('click', () => {
        skipToQuestion();
        window.scrollTo(0, 0);
    });
    startNewButton.addEventListener('click', () => {
        if (confirm('This will clear all your saved progress. Are you sure?')) {
            localStorage.removeItem('productMatchingAnswers');
            localStorage.removeItem('productMatchingUserName');
            localStorage.removeItem('productMatchingUserEmail');

            currentQuestionIndex = 0;
            userResponses = [];
            selectedMenuItems = {};

            initializeQuiz();
            showScreen(welcomeScreen);
        }
    });

    // Functions
    async function loadQuizData() {
        try {
            const response = await fetch('matching_eval_dataset.csv');
            const csvText = await response.text();

            const results = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true
            });

            console.log(`CSV parsing complete. Found ${results.data.length} rows`);
            processQuizData(results.data);

            return quizData;
        } catch (error) {
            console.error('Error loading CSV:', error);
            throw error;
        }
    }

    function processQuizData(data) {
        const processedData = data.map((row, index) => {
            console.log(`Processing row ${index + 1}:`, row.PRODUCT_ID, row.PRODUCT_NAME);

            const menuItemOptions = [];

            // Process the 10 menu item options
            for (let i = 1; i <= 10; i++) {
                const optionId = row[`ID_OPTION_${i}`];
                if (optionId) {
                    menuItemOptions.push({
                        id: parseInt(optionId),
                        name: row[`NAME_OPTION_${i}`] || '',
                        description: row[`BODY_OPTION_${i}`] || '',
                        brandId: row[`BRAND_ID_OPTION_${i}`] ? parseInt(row[`BRAND_ID_OPTION_${i}`]) : null,
                        brand: row[`BRAND_OPTION_${i}`] || '',
                        regions: row[`REGIONS_OPTION_${i}`] || '',
                        category: row[`CATEGORY_OPTION_${i}`] || '',
                        perPackCount: row[`PER_PACK_COUNT_OPTION_${i}`] || '',
                        imageText: row[`IMAGE_EXTRACTED_TEXT_OPTION_${i}`] || '',
                        weights: row[`WEIGHTS_OPTION_${i}`] || '',
                        complianceMg: row[`COMPLIANCE_MGS_OPTION_${i}`] || '',
                        mgSlugs: row[`MG_SLUGS_OPTION_${i}`] || '',
                        type: 'menu_item'
                    });
                }
            }

            // Add the "None of the above" option
            menuItemOptions.push({
                id: -1,
                name: 'None of the above',
                description: 'None of the provided menu items match this product.',
                brand: '',
                regions: '',
                category: '',
                type: 'none_of_above',
                isSpecial: true
            });

            // Parse correct menu item IDs
            let correctMenuItemIds = [];
            if (row.CORRECT_MENU_ITEM_IDS) {
                correctMenuItemIds = row.CORRECT_MENU_ITEM_IDS
                    .split(';')
                    .map(id => parseInt(id.trim()))
                    .filter(id => !isNaN(id));
            }

            return {
                questionNumber: index + 1,
                originalIndex: index,
                product: {
                    id: parseInt(row.PRODUCT_ID),
                    name: row.PRODUCT_NAME || '',
                    description: row.PRODUCT_DESCRIPTION || '',
                    imageText: row.PRODUCT_IMAGE_TEXT || '',
                    brand: row.PRODUCT_BRAND || '',
                    brandId: row.PRODUCT_BRAND_ID ? parseInt(row.PRODUCT_BRAND_ID) : null,
                    regions: row.PRODUCT_REGIONS || '',
                    category: row.PRODUCT_CATEGORY || '',
                    curationType: row.CURATION_TYPE || ''
                },
                menuItemOptions,
                correctMenuItemIds
            };
        });

        quizData = processedData;
        totalQuestions = quizData.length;
        console.log(`Quiz data processed. Total questions: ${totalQuestions}`);
    }

    function initializeQuiz() {
        if (!quizData || quizData.length === 0) {
            console.error("Quiz data not loaded");
            alert("No quiz questions were loaded. Please check the CSV file and try again.");
            return;
        }

        totalQuestions = quizData.length;
        totalQuestionsEl.textContent = totalQuestions;

        console.log(`Initializing responses for ${totalQuestions} questions`);
        userResponses = new Array(totalQuestions);
        selectedMenuItems = {};

        for (let i = 0; i < totalQuestions; i++) {
            userResponses[i] = {
                questionIndex: i,
                questionNumber: quizData[i].questionNumber,
                productId: quizData[i].product.id,
                productName: quizData[i].product.name,
                selectedMenuItems: {},
                notes: '',
                isSaved: false
            };
            selectedMenuItems[i] = {};
        }

        // Try to load saved responses
        const savedResponses = localStorage.getItem('productMatchingAnswers');
        if (savedResponses) {
            try {
                const parsed = JSON.parse(savedResponses);
                console.log("Found saved responses:", parsed);

                if (parsed && parsed.responses && Array.isArray(parsed.responses)) {
                    if (parsed.responses.length < totalQuestions) {
                        console.log(`Saved responses only has ${parsed.responses.length} items, extending to ${totalQuestions}`);
                        const originalLength = parsed.responses.length;
                        for (let i = originalLength; i < totalQuestions; i++) {
                            parsed.responses[i] = {
                                questionIndex: i,
                                questionNumber: quizData[i].questionNumber,
                                productId: quizData[i].product.id,
                                productName: quizData[i].product.name,
                                selectedMenuItems: {},
                                notes: '',
                                isSaved: false
                            };
                        }
                    } else if (parsed.responses.length > totalQuestions) {
                        console.log(`Saved responses has ${parsed.responses.length} items, truncating to ${totalQuestions}`);
                        parsed.responses = parsed.responses.slice(0, totalQuestions);
                    }

                    for (let i = 0; i < totalQuestions; i++) {
                        if (parsed.responses[i]) {
                            console.log(`Restoring saved response for question ${i+1}`);
                            userResponses[i] = {
                                ...userResponses[i],
                                ...parsed.responses[i],
                                questionIndex: i,
                                questionNumber: quizData[i].questionNumber,
                                productId: quizData[i].product.id,
                                productName: quizData[i].product.name,
                                notes: parsed.responses[i].notes || ''
                            };

                            if (parsed.responses[i].selectedMenuItems) {
                                selectedMenuItems[i] = {...parsed.responses[i].selectedMenuItems};
                            }
                        }
                    }

                    // Auto-resume quiz
                    const savedName = localStorage.getItem('productMatchingUserName');
                    const savedEmail = localStorage.getItem('productMatchingUserEmail');

                    if (savedName && savedEmail) {
                        userName.value = savedName;
                        userEmail.value = savedEmail;

                        let resumeIndex = 0;
                        let foundUnsaved = false;

                        for (let i = 0; i < totalQuestions; i++) {
                            if (!userResponses[i] || !userResponses[i].isSaved) {
                                resumeIndex = i;
                                foundUnsaved = true;
                                break;
                            }
                        }

                        if (!foundUnsaved && totalQuestions > 0) {
                            resumeIndex = totalQuestions - 1;
                        }

                        console.log(`Resuming at question ${resumeIndex + 1}`);
                        currentQuestionIndex = resumeIndex;

                        showScreen(quizScreen);
                        loadQuestion(currentQuestionIndex);
                        return;
                    }
                }
            } catch (error) {
                console.error('Error parsing saved responses:', error);
                localStorage.removeItem('productMatchingAnswers');
            }
        }
        currentQuestionIndex = 0;
    }

    function showScreen(screen) {
        [welcomeScreen, quizScreen, resultsScreen].forEach(s => {
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
    }

    function startQuiz() {
        if (!userName.value || !userEmail.value) {
            alert('Please enter your name and email to begin the evaluation.');
            return;
        }

        localStorage.setItem('productMatchingUserName', userName.value);
        localStorage.setItem('productMatchingUserEmail', userEmail.value);

        showScreen(quizScreen);
        loadQuestion(currentQuestionIndex);
        window.scrollTo(0, 0);
    }

    function loadQuestion(index) {
        if (index < 0 || index >= totalQuestions) {
            console.error(`Invalid question index: ${index}. Total questions: ${totalQuestions}`);
            return;
        }

        currentQuestionIndex = index;
        currentQuestionEl.textContent = index + 1;

        skipQuestionInput.value = index + 1;
        skipQuestionInput.max = totalQuestions;

        const question = quizData[index];
        if (!question) {
            console.error(`No question data found for index ${index}`);
            return;
        }
        console.log(`Loading question ${index + 1}: Product ${question.product.name}`);

        // Display product details
        let productHTML = `
            <p class="bold">${escapeHTML(question.product.name)}</p>
            <p><strong>Brand:</strong> ${escapeHTML(question.product.brand)}</p>
            <p><strong>Regions:</strong> ${escapeHTML(question.product.regions)}</p>
            <p><strong>Category:</strong> ${escapeHTML(question.product.category)}</p>
        `;

        if (question.product.description) {
            productHTML += `<p><strong>Description:</strong> ${escapeHTML(question.product.description)}</p>`;
        }

        if (question.product.imageText) {
            productHTML += `<p><strong>Image Text:</strong> ${escapeHTML(question.product.imageText)}</p>`;
        }

        if (question.product.curationType) {
            productHTML += `<p><strong>Curation Type:</strong> ${escapeHTML(question.product.curationType)}</p>`;
        }

        productItemDetails.innerHTML = productHTML;

        notesInput.value = userResponses[index]?.notes || '';

        // Display menu item options
        menuOptions.innerHTML = '';
        
        // Add selection summary
        updateSelectionSummary();

        question.menuItemOptions.forEach(option => {
            if (!selectedMenuItems[index]) {
                selectedMenuItems[index] = {};
            }
            const isSelected = selectedMenuItems[index] && selectedMenuItems[index][option.id];
            const optionHTML = createOptionHTML(option, isSelected);
            menuOptions.appendChild(optionHTML);

            optionHTML.addEventListener('click', () => toggleMenuItemSelection(option.id));
        });

        updateNavigationButtons();
    }

    function createOptionHTML(option, isSelected) {
        const optionEl = document.createElement('div');
        optionEl.className = `option ${isSelected ? 'selected' : ''} ${option.isSpecial ? 'special-option' : ''}`;
        optionEl.dataset.id = option.id;

        let optionHTML = `<div class="option-title">${escapeHTML(option.name)}</div>`;

        if (!option.isSpecial) {
            optionHTML += `
                <div class="option-details">
                    <div><strong>Brand:</strong> ${escapeHTML(option.brand)}</div>
            `;

            if (option.regions) {
                optionHTML += `<div><strong>Regions:</strong> ${escapeHTML(option.regions)}</div>`;
            }

            if (option.category) {
                optionHTML += `<div><strong>Category:</strong> ${escapeHTML(option.category)}</div>`;
            }

            if (option.weights) {
                optionHTML += `<div><strong>Weight/Size:</strong> ${escapeHTML(option.weights)}</div>`;
            }

            if (option.complianceMg && option.mgSlugs) {
                optionHTML += `<div><strong>Amount:</strong> ${escapeHTML(option.complianceMg)} ${escapeHTML(option.mgSlugs)}</div>`;
            }

            if (option.perPackCount) {
                optionHTML += `<div><strong>Per Pack:</strong> ${escapeHTML(option.perPackCount)}</div>`;
            }

            if (option.description) {
                optionHTML += `<div><strong>Description:</strong> ${escapeHTML(option.description)}</div>`;
            }

            if (option.imageText) {
                optionHTML += `<div><strong>Image Text:</strong> ${escapeHTML(option.imageText)}</div>`;
            }

            optionHTML += `</div>`;
        } else {
            optionHTML += `<div class="option-details">${escapeHTML(option.description)}</div>`;
        }

        optionEl.innerHTML = optionHTML;
        return optionEl;
    }

    function toggleMenuItemSelection(optionId) {
        const index = currentQuestionIndex;

        if (!selectedMenuItems[index]) {
            selectedMenuItems[index] = {};
        }

        optionId = Number(optionId);
        const wasSelected = !!selectedMenuItems[index][optionId];

        // Special handling for "None of the above"
        if (optionId === -1) {
            if (!wasSelected) {
                // Clear all other selections and select only "None of the above"
                selectedMenuItems[index] = {};
                selectedMenuItems[index][optionId] = true;
            } else {
                // Deselect "None of the above"
                delete selectedMenuItems[index][optionId];
            }
        } else {
            // Regular menu item options
            // If "None of the above" was selected, clear it
            if (selectedMenuItems[index][-1]) {
                delete selectedMenuItems[index][-1];
            }

            // Toggle the clicked option
            if (wasSelected) {
                delete selectedMenuItems[index][optionId];
            } else {
                selectedMenuItems[index][optionId] = true;
            }
        }

        if (userResponses[index]) {
            userResponses[index].selectedMenuItems = {...selectedMenuItems[index]};
            userResponses[index].isSaved = false;
        }

        loadQuestion(index);
        updateNavigationButtons();
    }

    function updateSelectionSummary() {
        const index = currentQuestionIndex;
        const existingSummary = document.querySelector('.selection-summary');
        if (existingSummary) {
            existingSummary.remove();
        }

        if (!selectedMenuItems[index]) {
            selectedMenuItems[index] = {};
        }

        const selectedCount = Object.values(selectedMenuItems[index]).filter(Boolean).length;
        
        const summaryEl = document.createElement('div');
        summaryEl.className = 'selection-summary';
        
        if (selectedCount === 0) {
            summaryEl.innerHTML = '<span class="count">No selections made</span> - Please select matching menu items or "None of the above"';
        } else if (selectedMenuItems[index][-1]) {
            summaryEl.innerHTML = '<span class="count">Selected: None of the above</span>';
        } else {
            summaryEl.innerHTML = `<span class="count">${selectedCount} menu item${selectedCount === 1 ? '' : 's'} selected</span>`;
        }

        menuOptions.insertBefore(summaryEl, menuOptions.firstChild);
    }

    function updateNavigationButtons() {
        const index = currentQuestionIndex;

        if (!selectedMenuItems[index]) selectedMenuItems[index] = {};
        if (!userResponses[index]) {
            userResponses[index] = { selectedMenuItems: {}, notes: '', isSaved: false };
        }

        prevButton.disabled = index === 0;

        const isLastQuestion = index >= totalQuestions - 1;

        const hasSelection = Object.values(selectedMenuItems[index]).some(value => value);
        const canSave = hasSelection;

        saveButton.disabled = !canSave;
        exportCsvButton.disabled = !canSave;

        // Finish button logic
        const existingFinishButton = document.getElementById('finish-button');
        if (existingFinishButton) {
            existingFinishButton.remove();
        }

        if (isLastQuestion) {
            const finishButton = document.createElement('button');
            finishButton.id = 'finish-button';
            finishButton.className = 'nav-button primary-button';
            finishButton.textContent = 'Finish & Download CSV';
            finishButton.disabled = !canSave;

            finishButton.addEventListener('click', () => {
                saveCurrentResponse();
                if (userResponses[index] && userResponses[index].isSaved) {
                    showResults();
                    downloadResults();
                    window.scrollTo(0, 0);
                } else {
                    alert("Please make at least one selection before finishing.");
                }
            });

            exportCsvButton.insertAdjacentElement('afterend', finishButton);
            nextButton.classList.add('hidden');
        } else {
            nextButton.classList.remove('hidden');
            const isCurrentResponseSaved = userResponses[index] && userResponses[index].isSaved;
            nextButton.disabled = !isCurrentResponseSaved;

            if (userResponses[index] && userResponses[index].isSaved) {
                saveButton.textContent = 'Saved ✓';
            } else {
                saveButton.textContent = 'Save & Continue';
            }
        }
    }

    function saveCurrentResponse() {
        const index = currentQuestionIndex;

        if (index < 0 || index >= totalQuestions) {
            console.error(`Cannot save response for invalid index: ${index}`);
            return;
        }

        const selections = selectedMenuItems[index] || {};
        const notesValue = notesInput.value.trim();

        const hasSelection = Object.values(selections).some(value => value);

        if (!hasSelection) {
            alert("Please select at least one menu item or 'None of the above' before saving.");
            return;
        }

        if (!userResponses[index]) {
            userResponses[index] = {};
        }

        userResponses[index] = {
            ...userResponses[index],
            questionIndex: index,
            questionNumber: quizData[index].questionNumber,
            productId: quizData[index].product.id,
            productName: quizData[index].product.name,
            selectedMenuItems: {...selections},
            notes: notesValue,
            timestamp: new Date().toISOString(),
            isSaved: true
        };

        console.log(`Saved response for question ${index + 1}:`, userResponses[index]);

        saveResponsesToLocalStorage();

        const existingConfirmation = document.querySelector('.save-confirmation');
        if(existingConfirmation) existingConfirmation.remove();

        const saveConfirmation = document.createElement('div');
        saveConfirmation.className = 'save-confirmation';
        saveConfirmation.textContent = 'Progress saved automatically ✓';
        saveConfirmation.style.position = 'fixed';
        saveConfirmation.style.bottom = '20px';
        saveConfirmation.style.right = '20px';
        saveConfirmation.style.backgroundColor = '#2ecc71';
        saveConfirmation.style.color = 'white';
        saveConfirmation.style.padding = '10px 20px';
        saveConfirmation.style.borderRadius = '4px';
        saveConfirmation.style.zIndex = '1000';
        saveConfirmation.style.opacity = '0';
        saveConfirmation.style.transition = 'opacity 0.3s ease-in-out';

        document.body.appendChild(saveConfirmation);

        // Fade in and out
        setTimeout(() => {
            saveConfirmation.style.opacity = '1';
            setTimeout(() => {
                saveConfirmation.style.opacity = '0';
                setTimeout(() => {
                    if (saveConfirmation.parentNode) {
                        document.body.removeChild(saveConfirmation);
                    }
                }, 300);
            }, 2000);
        }, 10);

        updateNavigationButtons();
    }

    function saveResponsesToLocalStorage() {
        const responsesToSave = userResponses.map(response => {
            if (!response) {
                console.warn("Found null entry in userResponses during save");
                return null;
            }
            return {
                questionIndex: response.questionIndex ?? null,
                questionNumber: response.questionNumber ?? null,
                productId: response.productId ?? null,
                productName: response.productName ?? '',
                selectedMenuItems: response.selectedMenuItems ?? {},
                notes: response.notes ?? '',
                timestamp: response.timestamp ?? null,
                isSaved: response.isSaved ?? false
            };
        }).filter(response => response !== null);

        const data = {
            userName: localStorage.getItem('productMatchingUserName') || '',
            userEmail: localStorage.getItem('productMatchingUserEmail') || '',
            timestamp: new Date().toISOString(),
            responses: responsesToSave
        };

        try {
            const jsonString = JSON.stringify(data);
            localStorage.setItem('productMatchingAnswers', jsonString);
            console.log("Saved progress to localStorage. Response count:", responsesToSave.length);
        } catch (error) {
            console.error("Error saving to localStorage:", error);
            let message = "Warning: Failed to save your progress. ";
            if (error.name === 'QuotaExceededError') {
                message += "Your browser storage is full. Please export your progress as CSV frequently and consider clearing storage for this site.";
            } else {
                message += "Please export your progress as CSV to avoid losing data.";
            }
            alert(message);
        }
    }

    function goToPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion(currentQuestionIndex);
        }
    }

    function goToNextQuestion() {
        if (currentQuestionIndex < totalQuestions - 1) {
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        } else {
            console.log("Attempted to go next from last question.");
            showResults();
        }
    }

    function skipToQuestion() {
        const targetQuestionNumber = parseInt(skipQuestionInput.value);
        if (isNaN(targetQuestionNumber) || targetQuestionNumber < 1 || targetQuestionNumber > totalQuestions) {
            alert(`Please enter a valid question number between 1 and ${totalQuestions}.`);
            skipQuestionInput.value = currentQuestionIndex + 1;
            return;
        }

        const targetQuestionIndex = targetQuestionNumber - 1;
        currentQuestionIndex = targetQuestionIndex;
        loadQuestion(currentQuestionIndex);
    }

    function showResults() {
        const unansweredQuestions = userResponses.filter((response, index) => !response || !response.isSaved);

        if (unansweredQuestions.length > 0) {
            const firstUnansweredIndex = userResponses.findIndex(response => !response || !response.isSaved);
            const goToUnanswered = confirm(`You still have ${unansweredQuestions.length} unsaved questions. Go to the first unsaved question (${firstUnansweredIndex + 1})?`);
            if (goToUnanswered) {
                currentQuestionIndex = firstUnansweredIndex;
                loadQuestion(currentQuestionIndex);
                return;
            }
        }

        showScreen(resultsScreen);
    }

    function downloadResults() {
        // Auto-save current response if valid but not saved
        const index = currentQuestionIndex;
        if (userResponses[index] && !userResponses[index].isSaved) {
            const selections = selectedMenuItems[index] || {};
            const hasSelection = Object.values(selections).some(value => value);
            if (hasSelection) {
                console.log("Auto-saving current response before download...");
                saveCurrentResponse();
            }
        }

        let answersToExport = [];
        if (userResponses && userResponses.length > 0) {
            answersToExport = userResponses.filter(response => response && response.isSaved);
        } else {
            alert('No answer data found. Please complete and save at least one question before exporting.');
            return;
        }

        if (answersToExport.length === 0) {
            alert('No saved responses found to export. Please save at least one question.');
            return;
        }

        console.log(`Exporting ${answersToExport.length} saved responses`);

        const rows = [];

        rows.push([
            'Question Index',
            'Question Number',
            'Product ID',
            'Product Name',
            'Selected Menu Item IDs',
            'Notes',
            'Timestamp (UTC)'
        ]);

        answersToExport.forEach(response => {
            const selectedMenuItemIds = Object.entries(response.selectedMenuItems || {})
                .filter(([id, isSelected]) => isSelected)
                .map(([id, _]) => id)
                .join(';');

            rows.push([
                response.questionIndex + 1,
                response.questionNumber || (response.questionIndex + 1),
                response.productId,
                response.productName,
                selectedMenuItemIds,
                response.notes || '',
                response.timestamp
            ]);
        });

        const csvString = Papa.unparse(rows);

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `product_matching_answers_${timestamp}.csv`;
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function restartQuiz() {
        if (confirm('Are you sure you want to start over? This will reset all your answers and clear saved progress.')) {
            localStorage.removeItem('productMatchingAnswers');

            currentQuestionIndex = 0;
            userResponses = [];
            selectedMenuItems = {};

            initializeQuiz();

            userName.value = localStorage.getItem('productMatchingUserName') || '';
            userEmail.value = localStorage.getItem('productMatchingUserEmail') || '';

            showScreen(welcomeScreen);
        }
    }

    // Helper function to escape HTML
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        const stringified = String(str);
        return stringified
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});