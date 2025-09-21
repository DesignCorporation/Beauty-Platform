#!/usr/bin/env node

// Используем встроенные модули Node.js
const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_BASE = 'http://localhost:6020/api'; // API Gateway
const AUTH_BASE = 'http://localhost:6020/api/auth'; // Auth через Gateway
const CRM_BASE = 'http://localhost:6022/api'; // CRM API напрямую (без Gateway)

// Тестовые данные для входа
const TEST_USER = {
  email: 'owner@beauty-test-salon.ru',
  password: 'owner123'
};

// Функция для логина и получения токена
async function login() {
  try {
    console.log('🔐 Выполняется вход в систему...');
    
    // Получаем CSRF токен
    const csrfResponse = await fetch(`${AUTH_BASE}/csrf-token`);
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    
    console.log('✅ CSRF токен получен:', csrfToken);
    
    // Выполняем вход
    const loginResponse = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(TEST_USER),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Вход выполнен успешно!');
    
    // Извлекаем cookies для дальнейших запросов
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies получены');
    
    return { csrfToken, cookies: cookies || '', user: loginData.user };
  } catch (error) {
    console.error('❌ Ошибка входа:', error.message);
    throw error;
  }
}

// Функция для создания услуги
async function createService(auth, serviceData) {
  try {
    console.log('🛍️ Создается услуга:', serviceData.name);
    
    const response = await fetch(`${CRM_BASE}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': auth.csrfToken,
        'Cookie': auth.cookies
      },
      body: JSON.stringify(serviceData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Service creation failed: ${response.status} ${errorText}`);
    }

    const service = await response.json();
    console.log('✅ Услуга создана:', service.name, `(ID: ${service.id})`);
    return service;
  } catch (error) {
    console.error('❌ Ошибка создания услуги:', error.message);
    throw error;
  }
}

// Функция для создания клиента
async function createClient(auth, clientData) {
  try {
    console.log('👤 Создается клиент:', clientData.name);
    
    const response = await fetch(`${CRM_BASE}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': auth.csrfToken,
        'Cookie': auth.cookies
      },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Client creation failed: ${response.status} ${errorText}`);
    }

    const client = await response.json();
    console.log('✅ Клиент создан:', client.name, `(ID: ${client.id})`);
    return client;
  } catch (error) {
    console.error('❌ Ошибка создания клиента:', error.message);
    throw error;
  }
}

// Основная функция
async function main() {
  console.log('🚀 Запуск создания тестовых данных для Beauty Platform CRM');
  console.log('================================================\n');

  try {
    // Шаг 1: Вход в систему
    const auth = await login();
    console.log(`👋 Добро пожаловать, ${auth.user.name}!\n`);

    // Шаг 2: Создание тестовых услуг
    console.log('📋 СОЗДАНИЕ ТЕСТОВЫХ УСЛУГ');
    console.log('==========================');
    
    const testServices = [
      {
        name: 'Стрижка женская',
        description: 'Классическая женская стрижка с укладкой',
        duration: 60,
        price: 1500
      },
      {
        name: 'Окрашивание волос',
        description: 'Полное окрашивание волос профессиональными красителями',
        duration: 120,
        price: 3500
      },
      {
        name: 'Мелирование',
        description: 'Частичное осветление прядей волос',
        duration: 180,
        price: 4500
      },
      {
        name: 'Укладка',
        description: 'Профессиональная укладка волос',
        duration: 45,
        price: 800
      },
      {
        name: 'Маникюр',
        description: 'Классический маникюр с покрытием гель-лак',
        duration: 90,
        price: 1200
      }
    ];

    const createdServices = [];
    for (const serviceData of testServices) {
      const service = await createService(auth, serviceData);
      createdServices.push(service);
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Создано услуг: ${createdServices.length}\n`);

    // Шаг 3: Создание тестовых клиентов
    console.log('👥 СОЗДАНИЕ ТЕСТОВЫХ КЛИЕНТОВ');
    console.log('=============================');
    
    const testClients = [
      {
        name: 'Иванова Анна Сергеевна',
        email: 'anna.ivanova@example.com',
        phone: '+7 (999) 123-45-67',
        birthday: '1990-03-15',
        notes: 'Предпочитает натуральные оттенки. Чувствительная кожа головы.'
      },
      {
        name: 'Петрова Мария Владимировна',
        email: 'maria.petrova@example.com',
        phone: '+7 (999) 234-56-78',
        birthday: '1985-07-22',
        notes: 'Регулярный клиент. Любит экспериментировать с цветом.'
      },
      {
        name: 'Сидорова Елена Александровна',
        email: 'elena.sidorova@example.com',
        phone: '+7 (999) 345-67-89',
        birthday: '1992-11-08',
        notes: 'Первое посещение. Хочет кардинально поменять образ.'
      },
      {
        name: 'Козлова Татьяна Игоревна',
        email: 'tatyana.kozlova@example.com',
        phone: '+7 (999) 456-78-90',
        notes: 'VIP клиент. Предпочитает утреннее время.'
      }
    ];

    const createdClients = [];
    for (const clientData of testClients) {
      const client = await createClient(auth, clientData);
      createdClients.push(client);
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Создано клиентов: ${createdClients.length}\n`);

    // Итоговый отчет
    console.log('🎉 СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ ЗАВЕРШЕНО!');
    console.log('====================================');
    console.log(`✅ Услуг создано: ${createdServices.length}`);
    console.log(`✅ Клиентов создано: ${createdClients.length}`);
    console.log('\n🔗 Теперь вы можете:');
    console.log('  • Открыть https://test-crm.beauty.designcorp.eu');
    console.log('  • Перейти в раздел "Услуги" и увидеть созданные услуги');
    console.log('  • Перейти в раздел "Клиенты" и увидеть созданных клиентов');
    console.log('  • Создать первую запись в календаре!\n');

    return { services: createdServices, clients: createdClients };

  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Запуск скрипта если файл запущен напрямую
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, login, createService, createClient };