import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Defining Elements
const addBookButton = document.querySelector("#saveButton");
const clearButton = document.querySelector("#clearButton");
const titleInput = document.querySelector("#titleInput");
const authorInput = document.querySelector("#authorInput");
const publisherInput = document.querySelector("#publisherInput");
const countInput = document.querySelector("#countInput");
const yearInput = document.querySelector("#yearInput");
const isbnInput = document.querySelector("#isbnInput");
const contentEl = document.querySelector(".content");
const notificationsEl = document.querySelector("#notifications");
const selectedBookEl = document.querySelector("#selectedBook");
const lendButton = document.querySelector("#lendButton");
const lentNameInput = document.querySelector("#toWho");
const dateInput = document.querySelector("#date");
const lendList = document.querySelector("#lendList");
const shelfNumberInput = document.querySelector("#shelfNumberInput");
const inventoryInput = document.querySelector("#inventoryInput");
const categoryInput = document.querySelector("#categoryInput");
const filterTitle = document.querySelector("#filterTitle");
const filterAuthor = document.querySelector("#filterAuthor");
const filterPublisher = document.querySelector("#filterPublisher");
const filterYear = document.querySelector("#filterYear");
const filterISBN = document.querySelector("#filterISBN");
const filterShelfNumber = document.querySelector("#filterShelfNumber");
const filterInventory = document.querySelector("#filterInventory");
const filterCategory = document.querySelector("#filterCategory");
const clearFiltersButton = document.querySelector("#clearFiltersButton");
const resultCount = document.querySelector("#resultCount");

let title;
let author;
let publisher;
let count;
let year;
let isbn;
let shelfNumber;
let inventory;
let category;

let books = [];
let lentBooks = [];
let alertDelay = 5000; // miliseconds
let editingID = null;

let selectedBook;
let toWho;
let date;

runEventListeners()

function runEventListeners(){
    document.addEventListener("DOMContentLoaded", pageLoaded);
    clearButton.addEventListener("click", clearBook);
    saveButton.addEventListener("click", addBook);
    contentEl.addEventListener("click", handleBookButtons);
    lendList.addEventListener("click", handleLentBookButtons)
    lendButton.addEventListener("click", lendBook);

    filterTitle.addEventListener("input", applyFilters);
    filterAuthor.addEventListener("input", applyFilters);
    filterPublisher.addEventListener("input", applyFilters);
    filterYear.addEventListener("input", applyFilters);
    filterISBN.addEventListener("input", applyFilters);
    filterInventory.addEventListener("input", applyFilters);
    filterShelfNumber.addEventListener("input", applyFilters);
    filterCategory.addEventListener("change", applyFilters);
    clearFiltersButton.addEventListener("click", clearFilters);

    //Export
    document.querySelector("#exportExcel").addEventListener("click", exportToExcel);
    document.querySelector("#exportPDF").addEventListener("click", exportToPDF);
    document.querySelector("#exportWord").addEventListener("click", exportToWord);

    setupBarcodeScanner();
}
function handleLentBookButtons(e){
    if(e.target.classList.contains("received")){
        const lentCard = e.target.closest(".lent");
        const lendId = parseInt(lentCard.dataset.id);
        deleteLendBookByID(lendId);
    }
}
function handleBookButtons(e){
    if(e.target.classList.contains("delete")){
        const bookCard = e.target.closest(".book");
        const bookId = parseInt(bookCard.dataset.id);
        deleteBookByID(bookId);
    }
    if(e.target.classList.contains("edit")){
        const bookCard = e.target.closest(".book");
        const bookId = parseInt(bookCard.dataset.id);
        editBookByID(bookId);
    }
    if(e.target.classList.contains("lend")){
        const bookCard = e.target.closest(".book");
        const bookId = parseInt(bookCard.dataset.id);
        selectBookByID(bookId);
    }
}
function lendBook(){
    if(getLendBookData()){
        const bookToLend = books.find(b => b.title === selectedBook);
        if(bookToLend){
            // Kitap adedini 1 azalt
            bookToLend.count = parseInt(bookToLend.count) - 1;
            
            // localStorage'ı güncelle
            localStorage.setItem("books", JSON.stringify(books));
            
            // Firebase'i güncelle
            if(window.saveBookToFirestore){
                window.saveBookToFirestore(bookToLend);
            }
            addLendBookToUI();
            addLendBookToStorage();
            refreshUI();
        }
        
    }
}
function addLendBookToStorage(){
    checkLendBooksFromStorage();
    const bookToLend = books.find(b => b.title === selectedBook);
    const newLendBook ={
        id: Date.now(),
        bookId: bookToLend ? bookToLend.id : null,
        selectedBook: selectedBook,
        toWho: toWho,
        date: date
    }
    lentBooks.push(newLendBook);
    localStorage.setItem("lentBooks", JSON.stringify(lentBooks));
    if(window.saveLentBookToFirestore){
        window.saveLentBookToFirestore(newLendBook);
    }
    clearLendBook();
    //showAlert("Book lent successfully!", "green");
    showAlert("book_lent", "green");
}
function clearLendBook(){
    selectedBookEl.textContent = window.t ? window.t('not_selected') : "Not Selected";
    lentNameInput.value = "";
    dateInput.value = "";
}
function addLendBookToUI(){
    const bookToLend = books.find(b => b.title === selectedBook);
    const lendBookData = {
        id: Date.now(),
        bookId: bookToLend ? bookToLend.id : null,
        selectedBook: selectedBook,
        toWho: toWho,
        date: date
    }
    displayLendBook(lendBookData);
}
function displayLendBook(lendBookData){
    const receivedText = window.t ? window.t('received_button') : 'Received';
    lendList.innerHTML += 
    `
    <div class="lent" data-id="${lendBookData.id}">
        <div class="lentName">${lendBookData.toWho}</div>
        <div class="lentBook">${lendBookData.selectedBook}</div>
        <div class="expdate">${lendBookData.date}</div>
        <button class="btn received"type="button" data-i18n="received_button">${receivedText}</button>
    </div>
    `
}
function getLendBookData(){
    clearLendBookData();
    toWho = lentNameInput.value;
    date = dateInput.value;
    if(toWho == null || toWho == ""){
        //showAlert("Please fill in the 'To who' field", "red");
        showAlert("fill-to-who", "red");
        return false;
    }
    return true;
}
function clearLendBookData(){
    toWho = "";
    date = ""; 
}
function selectBookByID(id){
    checkBooksFromStorage();
    const bookToLend = books.find(b => b.id === id);
    if(bookToLend){
        if(bookToLend.count > 0){
            selectedBook = bookToLend.title;
            //selectedBookEl.textContent = `Selected Book: ${selectedBook}`;.
            selectedBookEl.textContent = window.t ? 
                window.t('selected_book', {book: selectedBook}) :
                `Selected Book: ${selectedBook}`;
        }else{
            //showAlert("This book is currently out of stock", "red");
            showAlert("out_of_stock", "red");
            selectedBook = null;
            selectedBookEl.textContent = window.t ? window.t('not_selected') : "Not Selected";
        }
    }
}
function editBookByID(id){
    checkBooksFromStorage();
    const bookToEdit = books.find(b => b.id === id);
    if(bookToEdit){
        titleInput.value = bookToEdit.title;
        authorInput.value = bookToEdit.author;
        publisherInput.value = bookToEdit.publisher;
        countInput.value = bookToEdit.count;
        yearInput.value = bookToEdit.year;
        isbnInput.value = bookToEdit.isbn;
        shelfNumberInput.value = bookToEdit.shelfNumber;
        inventoryInput.value = bookToEdit.inventory || '';
        categoryInput.value = bookToEdit.category || '';

        editingID = id;
        saveButton.textContent = "Update";
        showAlert("edit_and_update", "blue");
    }
}
function deleteLendBookByID(id){
    checkLendBooksFromStorage();
    const lentBookToReturn = lentBooks.find(l => l.id === id);
    if(lentBookToReturn && lentBookToReturn.bookId){
        checkBooksFromStorage();
        const bookToReturn = books.find(b => b.id === lentBookToReturn.bookId);
        
        if(bookToReturn){
            bookToReturn.count = parseInt(bookToReturn.count) + 1;
            localStorage.setItem("books", JSON.stringify(books));
        
            if(window.saveBookToFirestore){
                window.saveBookToFirestore(bookToReturn);
            }
        }
    }
    lentBooks = lentBooks.filter(l => l.id !== id);
    localStorage.setItem("lentBooks", JSON.stringify(lentBooks));

    if(window.deleteLentBookFromFirestore){
        window.deleteLentBookFromFirestore(id);
    }
    refreshUI();
    showAlert("book_received", "green");
}
function deleteBookByID(id){
    checkBooksFromStorage();
    books = books.filter(b => b.id !== id);
    localStorage.setItem("books", JSON.stringify(books));

    if(window.deleteBookFromFirestore){
        window.deleteBookFromFirestore(id);
    }

    refreshUI();
    //showAlert("Book deleted!", "orange");
    showAlert("book_deleted", "orange");
}
function refreshUI(){
    contentEl.innerHTML = ``;
    loadBooksFromStorage();
    loadLentBooksFromStorage();
    applyFilters();
}
function pageLoaded(){
    loadBooksFromStorage();
    loadLentBooksFromStorage();
    const allBooks = document.querySelectorAll(".book");
    let totalBookCount = 0;

    allBooks.forEach(book => {
        const count = book.querySelector(".count").textContent;
        totalBookCount += parseInt(count) || 0;
    });

    setTimeout(() => {
        const allBooks = document.querySelectorAll(".book");
        let totalBookCount = 0;

        allBooks.forEach(book => {
            const count = book.querySelector(".count").textContent;
            totalBookCount += parseInt(count) || 0;
        });

        updateResultCount(allBooks.length, allBooks.length, totalBookCount);
    }, 200);
}
function loadBooksFromStorage(){
    checkBooksFromStorage();
    contentEl.innerHTML = '';
    books.forEach(bookData => {
        displayBook(bookData);
    });
}
function loadLentBooksFromStorage(){
    checkLendBooksFromStorage();
    lendList.innerHTML = '';
    lentBooks.forEach(lentBookData => {
        displayLendBook(lentBookData);
    });
}
function clearBook(){
    titleInput.value = "";
    authorInput.value = "";
    publisherInput.value = "";
    countInput.value = "";
    yearInput.value = "";
    isbnInput.value = "";
    shelfNumberInput.value = "";
    inventoryInput.value = "";
    categoryInput.value = "";
    editingID = null;
    saveButton.textContent = window.t ? window.t('add_button') : 'Add';
}
function clearBookData(){
    title = "";
    author = "";
    publisher = "";
    count = "";
    year = "";
    isbn = "";
    shelfNumber = "";
    inventory = "";
    category = "";
}
function getBookData(){
    clearBookData();
    title = titleInput.value;
    author = authorInput.value;
    publisher = publisherInput.value;
    count = countInput.value;
    year = yearInput.value;
    isbn = isbnInput.value;
    shelfNumber = shelfNumberInput.value;
    inventory = inventoryInput.value;
    category = categoryInput.value;
    if(title == null || title == "" || author == null || author == "" || publisher == null || publisher == ""){
        //showAlert("Please fill in the title, author and publisher fields", "red")
        showAlert("fill_required_fields", "red");
        return false;
    }
    return true;
}

function addBook(){
    if(getBookData()){
        if(editingID !== null){
            updateBook();
        }
        else{
            addBookToUI();
            addBookToStorage();
        }
    }
}
function updateBook(){
    checkBooksFromStorage();
    const index = books.findIndex(b => b.id === editingID);
    if(index !== -1){
        books[index] = {
            id: editingID,
            title: title,
            author: author,
            publisher: publisher,
            count: count,
            year: year,
            isbn: isbn,
            shelfNumber: shelfNumber,
            inventory: inventory,
            category: category
        };
    }
    localStorage.setItem("books", JSON.stringify(books));
    if(window.saveBookToFirestore){
        window.saveBookToFirestore(books[index]);
    }
    refreshUI();
    clearBook();
    showAlert("book_updated", "green");
}
function addBookToUI(){
    const bookData = {
        id: Date.now(),
        title: title,
        author: author,
        publisher: publisher,
        count: count,
        year: year,
        isbn: isbn,
        shelfNumber: shelfNumber,
        inventory: inventory,
        category: category
    };
    displayBook(bookData);
}
function displayBook(bookData){
    const deleteText = window.t ? window.t('delete_button') : 'Delete';
    const editText = window.t ? window.t('edit_button') : 'Edit';
    const lendText = window.t ? window.t('lend_action_button') : 'Lend';
    const categoryText = bookData.category && window.t ? 
        window.t('cat_' + bookData.category.toLowerCase().replace('-', '').replace(' ', '')) : 
        bookData.category || '';

    contentEl.innerHTML +=
    `
    <div class="book" data-id="${bookData.id}">
        <div class="title">${bookData.title}</div>
        <div class="author">${bookData.author}</div>
        <div class="publisher">${bookData.publisher}</div>
        <div class="count">${bookData.count}</div>
        <div class="year">${bookData.year}</div>
        <div class="isbn">${bookData.isbn}</div>
        <div class="shelfNumber">${bookData.shelfNumber}</div>
        <div class="inventory">${bookData.inventory || '-'}</div>
        <div class="category">${categoryText}</div>
        <div class="actions">
            <button class="delete"type="button" data-i18n="delete_button">${deleteText}</button>
            <button class="edit"type="button" data-i18n="edit_button">${editText}</button>
            <button class="lend" type="button" data-i18n="lend_action_button">${lendText}</button>
        </div>
    </div>
    `
}
function addBookToStorage(){
    checkBooksFromStorage();
    const newBook = {
        id: Date.now(),
        title: title,
        author: author,
        publisher: publisher,
        count: count,
        year: year,
        isbn: isbn,
        shelfNumber: shelfNumber,
        inventory: inventory,
        category: category,
    };
    books.push(newBook);
    localStorage.setItem("books", JSON.stringify(books));
    if(window.saveBookToFirestore){
        window.saveBookToFirestore(newBook);
    }
    clearBook();
    //showAlert("Book saved successfully!", "green");
    showAlert("book_saved","green");
}
function checkBooksFromStorage(){
    if(localStorage.getItem("books") === null){
        books = [];
    }else{
        books = JSON.parse(localStorage.getItem("books"))
    }
}
function checkLendBooksFromStorage(){
    if(localStorage.getItem("lentBooks") === null){
        lentBooks = [];
    }else{
        lentBooks = JSON.parse(localStorage.getItem("lentBooks"));
    }
}
function showAlert(message, color){
    const div = document.createElement("div");
    div.className = `alert ${color}`;
    //div.textContent = message;
    div.textContent = window.t ? window.t(message) : message;
    notificationsEl.appendChild(div);
    setTimeout(function(){
        div.remove();
    }, alertDelay);
}


function applyFilters(){
    const titleFilter = filterTitle.value.toLowerCase().trim();
    const authorFilter = filterAuthor.value.toLowerCase().trim();
    const publisherFilter = filterPublisher.value.toLowerCase().trim();
    const yearFilter = filterYear.value.toLowerCase().trim();
    const isbnFilter = filterISBN.value.toLowerCase().trim();
    const shelfNumberFilter = filterShelfNumber.value.toLowerCase().trim();
    const inventoryFilter = filterInventory.value.toLowerCase().trim();
    const categoryFilter = filterCategory.value;
    
    const allBooks = document.querySelectorAll(".book");
    let visibleCount = 0;
    let totalBookCount = 0; 
    allBooks.forEach(book => {
        const title = book.querySelector(".title").textContent.toLowerCase();
        const author = book.querySelector(".author").textContent.toLowerCase();
        const publisher = book.querySelector(".publisher").textContent.toLowerCase();
        const year = book.querySelector(".year").textContent.toLowerCase();
        const isbn = book.querySelector(".isbn").textContent.toLowerCase();
        const shelfNumber = book.querySelector(".shelfNumber").textContent.toLowerCase();
        const inventory = book.querySelector(".inventory").textContent.toLowerCase();
        const category = book.querySelector(".category").textContent;
        const count = book.querySelector(".count").textContent;
        
        const matchesTitle = title.includes(titleFilter);
        const matchesAuthor = author.includes(authorFilter);
        const matchesPublisher = publisher.includes(publisherFilter);
        const matchesYear = year.includes(yearFilter);
        const matchesISBN = isbn.includes(isbnFilter);
        const matchesInventory = inventory.includes(inventoryFilter);
        const matchesShelfNumber = inventory.includes(shelfNumberFilter);
        const matchesCategory = categoryFilter === '' || category === categoryFilter || 
            (window.t && category === window.t('cat_' + categoryFilter.toLowerCase().replace('-', '').replace(' ', '')));
        
        if(matchesTitle && matchesAuthor && matchesPublisher && matchesYear && matchesISBN && matchesInventory && matchesCategory && matchesShelfNumber){
            book.classList.remove("hidden");
            book.classList.add("visible");
            visibleCount ++;
            totalBookCount += parseInt(count) || 0;
        } else {
            book.classList.add("hidden");
            book.classList.remove("visible");
        }
    });
    
    updateResultCount(visibleCount, allBooks.length, totalBookCount);
}

function clearFilters(){
    filterTitle.value = "";
    filterAuthor.value = "";
    filterPublisher.value = "";
    filterYear.value = "";
    filterISBN.value = "";
    filterShelfNumber.value = "";
    filterInventory.value = "";
    filterCategory.value = "";
    
    const allBooks = document.querySelectorAll(".book");
    let totalBookCount = 0;
    allBooks.forEach(book => {
        book.classList.remove("hidden");
        book.classList.add("visible");

        const count = book.querySelector(".count").textContent;
        totalBookCount += parseInt(count) || 0;
    });
    
    updateResultCount(allBooks.length, allBooks.length, totalBookCount);
}

function updateResultCount(visible, total, bookCount){
    //resultCount.textContent = `Showing: ${visible} / ${total} titles (${bookCount} books)`;
    if(window.t && typeof window.t === 'function'){
        resultCount.textContent = window.t('showing_results', {
            visible: visible, 
            total: total, 
            count: bookCount
        });
    }else{
        resultCount.textContent = `Showing: ${visible} / ${total} titles (${bookCount} books)`;
    }
    
}

// Kullanıcının tüm verilerini Firestore'a kaydet
async function saveAllDataToFirestore(userId){
    if(!userId) return;
    
    try {
        // Books koleksiyonunu kaydet
        const booksRef = collection(window.db, `users/${userId}/books`);
        checkBooksFromStorage();
        
        for(const book of books){
            await setDoc(doc(booksRef, String(book.id)), book);
        }
        
        // Lent Books koleksiyonunu kaydet
        const lentBooksRef = collection(window.db, `users/${userId}/lentBooks`);
        checkLendBooksFromStorage();
        
        for(const lentBook of lentBooks){
            await setDoc(doc(lentBooksRef, String(lentBook.id)), lentBook);
        }
        
        console.log("All data saved to Firestore successfully!");
    } catch(error){
        console.error("Error saving to Firestore:", error);
        //showAlert("Failed to save data to cloud", "red");
        showAlert("data-save-failed", "red");
    }
}

// Firestore'dan kullanıcının verilerini yükle
async function loadUserDataFromFirestore(userId){
    if(!userId) return;
    
    try {
        // Books yükle
        const booksRef = collection(window.db, `users/${userId}/books`);
        const booksSnapshot = await getDocs(booksRef);
        
        books = [];
        booksSnapshot.forEach((doc) => {
            books.push(doc.data());
        });
        
        // Lent Books yükle
        const lentBooksRef = collection(window.db, `users/${userId}/lentBooks`);
        const lentBooksSnapshot = await getDocs(lentBooksRef);
        
        lentBooks = [];
        lentBooksSnapshot.forEach((doc) => {
            lentBooks.push(doc.data());
        });
        
        // localStorage'a da kaydet (offline çalışma için)
        localStorage.setItem("books", JSON.stringify(books));
        localStorage.setItem("lentBooks", JSON.stringify(lentBooks));
        
        // UI'ı güncelle
        refreshUI();
        loadLentBooksFromStorage();
        
        console.log("Data loaded from Firestore successfully!");
        //showAlert("Your data has been loaded!", "green");
        showAlert("data_loaded", "green");
    } catch(error){
        console.error("Error loading from Firestore:", error);
        //showAlert("Failed to load data from cloud", "red");
        showAlert("data_load_failed");
    }
}

// Tek bir kitabı Firestore'a kaydet
async function saveBookToFirestore(bookData){
    const user = window.currentUser || window.auth.currentUser;
    if(!user) return;
    
    try {
        const bookRef = doc(window.db, `users/${user.uid}/books`, String(bookData.id));
        await setDoc(bookRef, bookData);
        console.log("Book saved to Firestore");
    } catch(error){
        console.error("Error saving book:", error);
    }
}

// Tek bir kitabı Firestore'dan sil
async function deleteBookFromFirestore(bookId){
    const user = window.currentUser || window.auth.currentUser;
    if(!user) return;
    
    try {
        const bookRef = doc(window.db, `users/${user.uid}/books`, String(bookId));
        await deleteDoc(bookRef);
        console.log("Book deleted from Firestore");
    } catch(error){
        console.error("Error deleting book:", error);
    }
}
/*async function deleteLentBookFromFirestore(lendBookId){
    const user = window.currentUser || window.auth.currentUser;
    if(!user) return;
    
    try {
        const lendBookRef = doc(window.db, `users/${user.uid}/lentBooks`, String(lendBookId));
        await deleteDoc(lendBookRef);
        console.log("Book deleted from Firestore");
    } catch(error){
        console.error("Error deleting book:", error);
    }
}*/

// Tek bir ödünç kitabı kaydet
async function saveLentBookToFirestore(lentBookData){
    const user = window.currentUser || window.auth.currentUser;
    if(!user) return;
    
    try {
        const lentBookRef = doc(window.db, `users/${user.uid}/lentBooks`, String(lentBookData.id));
        await setDoc(lentBookRef, lentBookData);
        console.log("Lent book saved to Firestore");
    } catch(error){
        console.error("Error saving lent book:", error);
    }
}

// Tek bir ödünç kitabı sil
async function deleteLentBookFromFirestore(lentBookId){
    const user = window.currentUser || window.auth.currentUser;
    if(!user) return;
    
    try {
        const lentBookRef = doc(window.db, `users/${user.uid}/lentBooks`, String(lentBookId));
        await deleteDoc(lentBookRef);
        console.log("Lent book deleted from Firestore");
    } catch(error){
        console.error("Error deleting lent book:", error);
    }
}

function exportToExcel() {
    checkBooksFromStorage();
    
    if(books.length === 0) {
        showAlert("no_books_export", "red");
        return;
    }
    const excelData = books.map(book => ({
        [window.t('header_title')]: book.title,
        [window.t('header_author')]: book.author,
        [window.t('header_publisher')]: book.publisher,
        [window.t('header_count')]: book.count,
        [window.t('header_year')]: book.year,
        [window.t('header_isbn')]: book.isbn,
        [window.t('header_shelfNumber')]: book.shelfNumber,
        [window.t('header_inventory')]: book.inventory || '-', // EKLE
        [window.t('header_category')]: book.category ? window.t('cat_' + book.category.toLowerCase().replace('-', '').replace(' ', '')) : '-' // EKLE
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
        { wch: 30 }, { wch: 25 }, { wch: 30 }, 
        { wch: 8 }, { wch: 8 }, { wch: 20 }, { wch: 8 },
        { wch: 15 }, { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Kitaplar');
    const fileName = `Library_${new Date().toLocaleDateString('tr-TR')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showAlert("excel_exported", "green");
}

// PDF Export
function exportToPDF() {
    checkBooksFromStorage();
    
    if(books.length === 0) {
        showAlert("no_books_export", "red");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape', // portrait
        unit: 'mm',
        format: 'a4'
    });
    //doc.setFont("times", "normal");
    doc.setFontSize(18);
    doc.text(window.t ? window.t("library_name") : "Deneme", 105, 15, { align: 'center' });
    
    let dateText = window.t ? window.t("date_label") : "Date:"
    let authorText = window.t ? window.t("header_author") : "Author"
    let titleText = window.t ? window.t("header_title") : "Title"
    let publisherText = window.t ? window.t("header_publisher") : "Publisher"
    let countText = window.t ? window.t("header_count") : "Count"
    let yearText = window.t ? window.t("header_year") : "Year"
    let isbnText = window.t ? window.t("header_isbn") : "ISBN"
    let shelfNumberText = window.t ? window.t("header_shelfNumber") : "Shelf Number"
    let inventoryText = window.t ? window.t("header_inventory") : "Inventory"
    let categoryText = window.t ? window.t("header_category") : "Category"
    doc.setFontSize(10);
    doc.text(`${dateText}${new Date().toLocaleDateString('tr-TR')}`, 105, 22, { align: 'center' });

    const tableData = books.map(book => [
        book.title, book.author, book.publisher,
        book.count, book.year, book.isbn,, book.shelfNumber,
        book.inventory || '-',
        book.category ? (window.t ? window.t('cat_' + book.category.toLowerCase().replace('-', '').replace(' ', '')) : book.category) : '-'
    ]);

    doc.autoTable({
        head: [[titleText, authorText, publisherText, yearText, countText, isbnText, inventoryText, categoryText]],
        body: tableData,
        startY: 30,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [138, 43, 226], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            0: { cellWidth: 40 }, 1: { cellWidth: 35 }, 2: { cellWidth: 35 },
            3: { cellWidth: 15 }, 4: { cellWidth: 15 }, 5: { cellWidth: 35 }, 6: {cellWidth: 15}, 
            7: { cellWidth: 25 }, 8: { cellWidth: 25 }
        }
    });

    const finalY = doc.lastAutoTable.finalY || 30;
    const totalBooks = books.reduce((sum, book) => sum + parseInt(book.count), 0);
    
    doc.setFontSize(10);

    doc.text(`${window.t('total_books')}: ${totalBooks}`, 14, finalY + 10);
    doc.text(`${window.t('total_titles')}: ${books.length}`, 14, finalY + 17);

    const fileName = `${window.t('library_name')}_${new Date().toLocaleDateString('tr-TR')}.pdf`;
    doc.save(fileName);

    showAlert("pdf_exported", "green");
}

// Word Export
async function exportToWord() {
    checkBooksFromStorage();
    
    if(books.length === 0) {
        showAlert("no_books_export", "red");
        return;
    }

    try {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, TextRun, BorderStyle } = docx;

        // Tablo satırlarını oluştur
        const tableRows = [
            // Başlık satırı
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_title'), bold: true })],
                        width: { size: 30, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_author'), bold: true })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_publisher'), bold: true })],
                        width: { size: 25, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_count'), bold: true })],
                        width: { size: 8, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_year'), bold: true })],
                        width: { size: 8, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_isbn'), bold: true })],
                        width: { size: 9, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_shelfNumber'), bold: true })],
                        width: { size: 9, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_inventory'), bold: true })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: window.t('header_category'), bold: true })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    })
                ]
            })
        ];

        // Kitap satırlarını ekle
        books.forEach(book => {
            const categoryDisplay = book.category ? 
                (window.t ? window.t('cat_' + book.category.toLowerCase().replace('-', '').replace(' ', '')) : book.category) : 
                '-';
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(book.title || '')] }),
                        new TableCell({ children: [new Paragraph(book.author || '')] }),
                        new TableCell({ children: [new Paragraph(book.publisher || '')] }),
                        new TableCell({ children: [new Paragraph(String(book.count || ''))] }),
                        new TableCell({ children: [new Paragraph(book.year || '')] }),
                        new TableCell({ children: [new Paragraph(book.isbn || '')] }),
                        new TableCell({ children: [new Paragraph(book.shelfNumber || '')] }),
                        new TableCell({ children: [new Paragraph(book.inventory || '-')] }),
                        new TableCell({ children: [new Paragraph(categoryDisplay)] })
                    ]
                })
            );
        });

        const totalBooks = books.reduce((sum, book) => sum + parseInt(book.count), 0);

        // Word belgesi oluştur
        const doc = new Document({
            sections: [{
                children: [
                    // Başlık
                    new Paragraph({
                        text: window.t('my_library'),
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    // Tarih
                    new Paragraph({
                        text: `${window.t('date')}: ${new Date().toLocaleDateString('tr-TR')}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    // Tablo
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    }),
                    // Boşluk
                    new Paragraph({
                        text: '',
                        spacing: { before: 400 }
                    }),
                    // İstatistikler
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${window.t('total_books')}: ${totalBooks}`,
                                bold: true
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${window.t('total_titles')}: ${books.length}`,
                                bold: true
                            })
                        ]
                    })
                ]
            }]
        });

        // Dosyayı oluştur ve indir
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${window.t('my_library')}_${new Date().toLocaleDateString('tr-TR')}.docx`;
        link.click();
        window.URL.revokeObjectURL(url);

        showAlert("word_exported", "green");
    } catch (error) {
        console.error('Word export error:', error);
        showAlert("no_books_export", "red");
    }
}

// ISBN okunduğunda kitap bilgilerini API'den çek
async function fetchBookInfoByISBN(isbn) {
    // ISBN'i temizle (tireler, boşluklar vs.)
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    if(cleanISBN.length < 10) {
        return; // Geçerli bir ISBN değil
    }
    
    try {
        // Google Books API'ye istek at
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
        const data = await response.json();
        
        if(data.items && data.items.length > 0) {
            const book = data.items[0].volumeInfo;
            
            // Alanları otomatik doldur
            if(book.title) {
                titleInput.value = book.title;
            }
            
            if(book.authors && book.authors.length > 0) {
                authorInput.value = book.authors.join(', ');
            }
            
            if(book.publisher) {
                publisherInput.value = book.publisher;
            }
            
            if(book.publishedDate) {
                const year = book.publishedDate.split('-')[0];
                yearInput.value = year;
            }
            
            // ISBN zaten girilmiş
            isbnInput.value = cleanISBN;
            
            // Başarı mesajı
            showAlert("book_info_loaded", "green");
            
            // Count input'una focus yap (kullanıcı sadece adet girsin)
            countInput.focus();
        } else {
            showAlert("book_not_found_api", "red");
        }
    } catch (error) {
        console.error('API Error:', error);
        showAlert("api_error", "red");
    }
}

// ISBN input'una event listener ekle
function setupBarcodeScanner() {
    let isbnBuffer = '';
    let lastKeyTime = Date.now();
    
    // ISBN input'una özel dinleyici
    isbnInput.addEventListener('keypress', function(e) {
        const currentTime = Date.now();
        
        // Eğer tuşlar arasında 100ms'den az süre varsa barkod okuyucu
        if(currentTime - lastKeyTime < 100) {
            isbnBuffer += e.key;
        } else {
            isbnBuffer = e.key;
        }
        
        lastKeyTime = currentTime;
        
        // ENTER tuşuna basıldığında (barkod okuyucu otomatik basar)
        if(e.key === 'Enter') {
            e.preventDefault();
            fetchBookInfoByISBN(isbnBuffer);
            isbnBuffer = '';
        }
    });
    
    // Normal yazım için de destekle
    isbnInput.addEventListener('blur', function() { // input --> Sadece enter ile, blur --> farklı alana geçildiğinde de çağırır.
        if(isbnInput.value.length >= 10) {
            fetchBookInfoByISBN(isbnInput.value);
        }
    });
}

// Global olarak erişilebilir yap
window.saveAllDataToFirestore = saveAllDataToFirestore;
window.loadUserDataFromFirestore = loadUserDataFromFirestore;
window.saveBookToFirestore = saveBookToFirestore;
window.deleteBookFromFirestore = deleteBookFromFirestore;
window.saveLentBookToFirestore = saveLentBookToFirestore;
window.deleteLentBookFromFirestore = deleteLentBookFromFirestore;
window.loadLentBooksFromStorage = loadLentBooksFromStorage;
window.refreshUI = refreshUI;
