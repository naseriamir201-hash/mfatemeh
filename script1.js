// اطلاعات JSONBin.io
const BIN_ID = '68b6f85243b1c97be9347a9a';
const API_KEY = '$2a$10$2AF3ISUxw4sYK/HYMsMcSejf68K2fneKCWykdjpPKGpazJBzGUiTK';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// داده‌های نمونه
let people = [];
let isCoach = false;
let currentUserType = 'parent';

// المنت‌های DOM
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const coachLoginForm = document.getElementById('coach-login-form');
const parentView = document.getElementById('parent-view');
const parentBtn = document.getElementById('parent-btn');
const coachBtn = document.getElementById('coach-btn');
const loginBtn = document.getElementById('login-btn');
const viewDataBtn = document.getElementById('view-data-btn');
const logoutBtn = document.getElementById('logout-btn');
const notification = document.getElementById('notification');

// مدیریت نوع کاربر
parentBtn.addEventListener('click', () => {
    parentBtn.classList.add('active');
    coachBtn.classList.remove('active');
    coachLoginForm.classList.add('hidden');
    parentView.classList.remove('hidden');
    currentUserType = 'parent';
});

coachBtn.addEventListener('click', () => {
    coachBtn.classList.add('active');
    parentBtn.classList.remove('active');
    coachLoginForm.classList.remove('hidden');
    parentView.classList.add('hidden');
    currentUserType = 'coach';
});

// ورود مربیان
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'coach' && password === '1234') {
        isCoach = true;
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadPeopleData();
        showNotification('با موفقیت وارد شدید!', 'success');
    } else {
        showNotification('نام کاربری یا رمز عبور اشتباه است!', 'error');
    }
});

// مشاهده داده‌ها توسط والدین
viewDataBtn.addEventListener('click', () => {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    loadPeopleData();
    // غیرفعال کردن تب‌های ویرایش برای والدین
    document.querySelectorAll('.tab-link').forEach((tab, index) => {
        if (index < 3) { // تب‌های ثبت اطلاعات
            tab.style.display = 'none';
        }
    });
});

// خروج از سیستم
logoutBtn.addEventListener('click', () => {
    isCoach = false;
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.style.display = 'block';
    });
    showNotification('با موفقیت خارج شدید!', 'success');
});

// مدیریت تب‌ها
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// ثبت فرد جدید
document.getElementById('person-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const family = document.getElementById('family').value;
    const age = document.getElementById('age').value;
    const phone = document.getElementById('phone').value;
    const photoFile = document.getElementById('photo').files[0];
    
    let photoUrl = '';
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            photoUrl = e.target.result;
            addPerson(name, family, age, phone, photoUrl);
        };
        reader.readAsDataURL(photoFile);
    } else {
        addPerson(name, family, age, phone, photoUrl);
    }
});

async function addPerson(name, family, age, phone, photoUrl) {
    const newPerson = {
        id: Date.now(),
        name,
        family,
        age,
        phone,
        photo: photoUrl,
        attendances: [],
        scores: []
    };
    
    try {
        // دریافت داده‌های فعلی
        const response = await fetch(API_URL, {
            headers: {
                'X-Master-Key': API_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const currentData = await response.json();
        
        // اضافه کردن فرد جدید
        const updatedData = Array.isArray(currentData) ? currentData : [];
        updatedData.push(newPerson);
        
        // ذخیره داده‌های به‌روز شده
        const updateResponse = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(updatedData)
        });
        
        if (updateResponse.ok) {
            showNotification('فرد جدید با موفقیت ثبت شد!', 'success');
            document.getElementById('person-form').reset();
            loadPeopleData();
        } else {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'خطا در ذخیره داده‌ها');
        }
    } catch (error) {
        console.error("Error adding person: ", error);
        showNotification('خطا در ثبت فرد جدید! ' + error.message, 'error');
    }
}

// بروزرسانی dropdownهای انتخاب فرد
function updatePersonSelects() {
    const personSelect = document.getElementById('person-select');
    const scorePersonSelect = document.getElementById('score-person-select');
    
    personSelect.innerHTML = '<option value="">لطفا یک فرد انتخاب کنید</option>';
    scorePersonSelect.innerHTML = '<option value="">لطفا یک فرد انتخاب کنید</option>';
    
    people.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = `${person.name} ${person.family}`;
        
        personSelect.appendChild(option.cloneNode(true));
        scorePersonSelect.appendChild(option);
    });
}

// ثبت حضور
document.getElementById('attendance-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const personId = parseInt(document.getElementById('person-select').value);
    const date = document.getElementById('attendance-date').value;
    
    if (!personId) {
        showNotification('لطفا یک فرد انتخاب کنید!', 'error');
        return;
    }
    
    try {
        // دریافت داده‌های فعلی
        const response = await fetch(API_URL, {
            headers: {
                'X-Master-Key': API_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const currentData = await response.json();
        
        // پیدا کردن فرد و اضافه کردن تاریخ حضور
        const personIndex = currentData.findIndex(p => p.id === personId);
        if (personIndex === -1) {
            throw new Error('فرد مورد نظر یافت نشد');
        }
        
        if (!currentData[personIndex].attendances) {
            currentData[personIndex].attendances = [];
        }
        
        if (currentData[personIndex].attendances.includes(date)) {
            showNotification('این فرد قبلا در این تاریخ حضور ثبت شده است!', 'error');
            return;
        }
        
        currentData[personIndex].attendances.push(date);
        
        // ذخیره داده‌های به‌روز شده
        const updateResponse = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(currentData)
        });
        
        if (updateResponse.ok) {
            showNotification('حضور با موفقیت ثبت شد!', 'success');
            this.reset();
            loadPeopleData();
        } else {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'خطا در ذخیره داده‌ها');
        }
    } catch (error) {
        console.error("Error updating attendance: ", error);
        showNotification('خطا در ثبت حضور! ' + error.message, 'error');
    }
});

// ثبت امتیاز
document.getElementById('score-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const personId = parseInt(document.getElementById('score-person-select').value);
    const score = parseInt(document.getElementById('score').value);
    
    if (!personId) {
        showNotification('لطفا یک فرد انتخاب کنید!', 'error');
        return;
    }
    
    try {
        // دریافت داده‌های فعلی
        const response = await fetch(API_URL, {
            headers: {
                'X-Master-Key': API_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const currentData = await response.json();
        
        // پیدا کردن فرد و اضافه کردن امتیاز
        const personIndex = currentData.findIndex(p => p.id === personId);
        if (personIndex === -1) {
            throw new Error('فرد مورد نظر یافت نشد');
        }
        
        if (!currentData[personIndex].scores) {
            currentData[personIndex].scores = [];
        }
        
        currentData[personIndex].scores.push(score);
        
        // ذخیره داده‌های به‌روز شده
        const updateResponse = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(currentData)
        });
        
        if (updateResponse.ok) {
            showNotification('امتیاز با موفقیت ثبت شد!', 'success');
            this.reset();
            loadPeopleData();
        } else {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'خطا در ذخیره داده‌ها');
        }
    } catch (error) {
        console.error("Error updating score: ", error);
        showNotification('خطا در ثبت امتیاز! ' + error.message, 'error');
    }
});

// بارگذاری و نمایش داده‌ها
async function loadPeopleData() {
    const tableBody = document.querySelector('#people-table tbody');
    tableBody.innerHTML = '';
    
    // نمایش وضعیت در حال بارگذاری
    tableBody.innerHTML = '<tr><td colspan="8">در حال بارگذاری داده‌ها...</td></tr>';
    
    try {
        // دریافت داده‌ها از JSONBin.io
        const response = await fetch(API_URL, {
            headers: {
                'X-Master-Key': API_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        // بررسی ساختار داده‌های دریافتی
        people = Array.isArray(data) ? data : [];
        
        // پاک کردن وضعیت در حال بارگذاری
        tableBody.innerHTML = '';
        
        // نمایش داده‌ها در جدول
        if (people.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8">هیچ داده‌ای برای نمایش وجود ندارد.</td></tr>';
        } else {
            people.forEach(person => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${person.photo ? `<img src="${person.photo}" class="user-image">` : 'بدون عکس'}</td>
                    <td>${person.name || 'نامشخص'}</td>
                    <td>${person.family || 'نامشخص'}</td>
                    <td>${person.age || 'نامشخص'}</td>
                    <td>${person.phone || 'نامشخص'}</td>
                    <td>${person.attendances?.join(', ') || 'بدون حضور'}</td>
                    <td>${person.scores?.join(', ') || 'بدون امتیاز'}</td>
                    <td>
                        ${isCoach ? `
                            <button class="action-btn edit-btn" onclick="editPerson(${person.id})">ویرایش</button>
                            <button class="action-btn delete-btn" onclick="deletePerson(${person.id})">حذف</button>
                        ` : 'غیرقابل ویرایش'}
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        
        updatePersonSelects();
    } catch (error) {
        console.error("Error loading people: ", error);
        showNotification('خطا در بارگذاری داده‌ها! ' + error.message, 'error');
        tableBody.innerHTML = '<tr><td colspan="8">خطا در بارگذاری داده‌ها. لطفا دوباره تلاش کنید.</td></tr>';
    }
}

// ویرایش فرد
async function editPerson(id) {
    const person = people.find(p => p.id === id);
    if (!person) return;
    
    const newName = prompt('نام جدید:', person.name);
    if (newName === null) return;
    
    const newFamily = prompt('نام خانوادگی جدید:', person.family);
    if (newFamily === null) return;
    
    const newAge = prompt('سن جدید:', person.age);
    if (newAge === null) return;
    
    const newPhone = prompt('شماره تماس جدید:', person.phone);
    if (newPhone === null) return;
    
    try {
        // دریافت داده‌های فعلی
        const response = await fetch(API_URL, {
            headers: {
                'X-Master-Key': API_KEY,
                'X-Bin-Meta': 'false'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const currentData = await response.json();
        
        // پیدا کردن فرد و به‌روزرسانی اطلاعات
        const personIndex = currentData.findIndex(p => p.id === id);
        if (personIndex === -1) {
            throw new Error('فرد مورد نظر یافت نشد');
        }
        
        currentData[personIndex].name = newName;
        currentData[personIndex].family = newFamily;
        currentData[personIndex].age = newAge;
        currentData[personIndex].phone = newPhone;
        
        // ذخیره داده‌های به‌روز شده
        const updateResponse = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify(currentData)
        });
        
        if (updateResponse.ok) {
            showNotification('اطلاعات با موفقیت ویرایش شد!', 'success');
            loadPeopleData();
        } else {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'خطا در ذخیره داده‌ها');
        }
    } catch (error) {
        console.error("Error updating person: ", error);
        showNotification('خطا در ویرایش اطلاعات! ' + error.message, 'error');
    }
}

// حذف فرد
async function deletePerson(id) {
    if (confirm('آیا از حذف این فرد اطمینان دارید؟')) {
        try {
            // دریافت داده‌های فعلی
            const response = await fetch(API_URL, {
                headers: {
                    'X-Master-Key': API_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const currentData = await response.json();
            
            // حذف فرد از داده‌ها
            const updatedData = currentData.filter(person => person.id !== id);
            
            // ذخیره داده‌های به‌روز شده
            const updateResponse = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY,
                    'X-Bin-Versioning': 'false'
                },
                body: JSON.stringify(updatedData)
            });
            
            if (updateResponse.ok) {
                showNotification('فرد با موفقیت حذف شد!', 'success');
                loadPeopleData();
            } else {
                const errorData = await updateResponse.json();
                throw new Error(errorData.message || 'خطا در ذخیره داده‌ها');
            }
        } catch (error) {
            console.error("Error deleting person: ", error);
            showNotification('خطا در حذف فرد! ' + error.message, 'error');
        }
    }
}

// نمایش اعلان
function showNotification(message, type) {
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.backgroundColor = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// بارگذاری اولیه داده‌ها
document.addEventListener('DOMContentLoaded', function() {
    // مخفی کردن فرم مربیان در ابتدا
    coachLoginForm.classList.add('hidden');
    parentView.classList.remove('hidden');
    
    // بارگذاری داده‌ها برای والدین
    if (currentUserType === 'parent') {
        loadPeopleData();
    }
});

// اضافه کردن توابع به global scope برای دسترسی از onclick
window.editPerson = editPerson;
window.deletePerson = deletePerson;