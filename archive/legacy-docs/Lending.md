<html><head>
<meta charset="utf-8"/>
<link crossorigin="" href="https://fonts.gstatic.com/" rel="preconnect"/>
<link as="style" href="https://fonts.googleapis.com/css2?display=swap&amp;family=Noto+Sans%3Awght%40400%3B500%3B700%3B900&amp;family=Plus+Jakarta+Sans%3Awght%40400%3B500%3B700%3B800" onload="this.rel='stylesheet'" rel="stylesheet"/>
<title>Beauty .DesignCorp - The All-in-One Platform for Beauty Salons</title>
<link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style type="text/tailwindcss">
    :root {
        --primary-color: #e92933;
        --background-color: #f9f9f9;
        --text-primary: #333333;
        --text-secondary: #666666;
        --accent-color: #f2f2f2;
      }
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .button_primary {
        @apply bg-[var(--primary-color)] text-white font-bold py-2 px-4 rounded-md hover:bg-red-700;
      }
      .button_secondary {
        @apply bg-[var(--accent-color)] text-[var(--text-primary)] font-bold py-2 px-4 rounded-md hover:bg-gray-200;
      }.accordion-item {
        @apply border-b border-gray-200;
      }
      .accordion-header {
        @apply flex justify-between items-center p-5 cursor-pointer;
      }
      .accordion-content {
        @apply max-h-0 overflow-hidden transition-all duration-500 ease-in-out;
      }
      .accordion-content p {
        @apply p-5 pt-0;
      }
      input[type="radio"]:checked ~ .accordion-content {
        @apply max-h-screen;
      }.counter {
        transition: all 1.3s ease-out;
      }
      </style>
</head>
<body class="bg-[var(--background-color)] text-[var(--text-primary)]">
<div class="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
<div class="layout-container flex h-full grow flex-col">
<header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] px-10 py-4 shadow-sm bg-white sticky top-0 z-50">
<div class="flex items-center gap-4 text-[var(--text-primary)]">
<div class="w-8 h-8 text-[var(--primary-color)]">
<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path clip-rule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill="currentColor" fill-rule="evenodd"></path>
</svg>
</div>
<h2 class="text-xl font-bold leading-tight tracking-[-0.015em]">Beauty .DesignCorp</h2>
</div>
<div class="flex flex-1 justify-end items-center gap-8">
<nav class="flex items-center gap-9">
<a class="text-sm font-medium leading-normal hover:text-[var(--primary-color)] transition-colors" href="#features">Product</a>
<a class="text-sm font-medium leading-normal hover:text-[var(--primary-color)] transition-colors" href="#how-it-works">How it works</a>
<a class="text-sm font-medium leading-normal hover:text-[var(--primary-color)] transition-colors" href="#widget">Widget</a>
<a class="text-sm font-medium leading-normal hover:text-[var(--primary-a)] transition-colors" href="#pricing">Pricing</a>
<a class="text-sm font-medium leading-normal hover:text-[var(--primary-color)] transition-colors" href="#faq">FAQ</a>
<a class="text-sm font-medium leading-normal hover:text-[var(--primary-color)] transition-colors" href="#blog">Blog</a>
</nav>
<div class="flex items-center gap-4">
<div class="text-sm font-medium text-[var(--text-secondary)]">
<a class="hover:text-[var(--primary-color)]" href="#">PL</a>
<span>·</span>
<a class="font-bold text-[var(--text-primary)] hover:text-[var(--primary-color)]" href="#">EN</a>
</div>
<div class="flex gap-3">
<button class="button_primary h-10 px-4">
<span class="truncate">Get started</span>
</button>
<button class="button_secondary h-10 px-4">
<span class="truncate">Log in</span>
</button>
</div>
</div>
</div>
</header>
<main class="flex-1">
<section class="relative">
<div class="absolute inset-0 bg-black opacity-50"></div>
<div class="min-h-[600px] flex flex-col items-start justify-center px-10 md:px-40 py-20 bg-cover bg-center bg-no-repeat saturate-2" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAizC4lTAE6MZz8MpgXYsvaazv_ifIpeXJeGbLyDky0aAY-eGgThU74ETyAeME1MwPtNwvAj9EKt0Q-fFJpbCM2uuUARSSlW23erv2eskOkbIR2LjiFUT-mWeFROUp_IEeW1RUAo-AZCchwyfhAjb2b9tDVQ4wlAocO9iL619eGREDbFarFiyZt2ypBRhp5__NX7Ta9bbLljW08sDGfGjg2JMkS0BaoCHCuzfG0lsaWjVIKi-Kp5ar810XmIIF-CRfj8cs4Vi6mHaA");'>
<div class="relative z-10 flex flex-col gap-6 text-left max-w-2xl">
<h1 class="text-white text-5xl md:text-6xl font-black leading-tight tracking-tighter">The all-in-one platform for beauty salons</h1>
<p class="text-white text-lg md:text-xl font-normal leading-normal">Beauty .DesignCorp is the all-in-one platform for beauty salons. Manage your business, connect with clients, and grow your revenue.</p>
<button class="button_primary h-12 px-6 self-start text-base">
<span class="truncate">Get started for free</span>
</button>
</div>
</div>
</section>
<div class="container mx-auto px-4 py-16">
<div class="flex flex-col gap-16">
<section class="text-center" id="features">
<h2 class="text-4xl font-bold mb-4">Run your business from anywhere</h2>
<p class="text-[var(--text-secondary)] max-w-3xl mx-auto">Beauty .DesignCorp provides all the tools you need to manage your salon efficiently, giving you more time to focus on your clients.</p>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
<div class="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
<div class="text-[var(--primary-color)] mb-4" data-icon="Calendar" data-size="48px" data-weight="regular">
<svg fill="currentColor" height="48px" viewBox="0 0 256 256" width="48px" xmlns="http://www.w3.org/2000/svg">
<path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"></path>
</svg>
</div>
<h3 class="text-lg font-bold">Online booking</h3>
<p class="text-sm text-[var(--text-secondary)]">Let clients book appointments online, 24/7.</p>
</div>
<div class="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
<div class="text-[var(--primary-color)] mb-4" data-icon="Users" data-size="48px" data-weight="regular">
<svg fill="currentColor" height="48px" viewBox="0 0 256 256" width="48px" xmlns="http://www.w3.org/2000/svg">
<path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
</svg>
</div>
<h3 class="text-lg font-bold">Client management</h3>
<p class="text-sm text-[var(--text-secondary)]">Keep track of client information, preferences, and history.</p>
</div>
<div class="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
<div class="text-[var(--primary-color)] mb-4" data-icon="CreditCard" data-size="48px" data-weight="regular">
<svg fill="currentColor" height="48px" viewBox="0 0 256 256" width="48px" xmlns="http://www.w3.org/2000/svg">
<path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,16V88H32V64Zm0,128H32V104H224v88Zm-16-24a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h32A8,8,0,0,1,208,168Zm-64,0a8,8,0,0,1-8,8H120a8,8,0,0,1,0-16h16A8,8,0,0,1,144,168Z"></path>
</svg>
</div>
<h3 class="text-lg font-bold">Payments</h3>
<p class="text-sm text-[var(--text-secondary)]">Accept payments online and in person seamlessly.</p>
</div>
<div class="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
<div class="text-[var(--primary-color)] mb-4" data-icon="ChartLine" data-size="48px" data-weight="regular">
<svg fill="currentColor" height="48px" viewBox="0 0 256 256" width="48px" xmlns="http://www.w3.org/2000/svg">
<path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
</svg>
</div>
<h3 class="text-lg font-bold">Reporting</h3>
<p class="text-sm text-[var(--text-secondary)]">Track your business performance with detailed reports.</p>
</div>
</div>
</section>
<section class="text-center">
<h2 class="text-4xl font-bold mb-4">Connect with clients effortlessly</h2>
<p class="text-[var(--text-secondary)] max-w-3xl mx-auto">Build strong relationships with your clients through powerful communication and marketing tools that keep them engaged and coming back.</p>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
<div class="flex flex-col gap-4">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg shadow-md overflow-hidden" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCkdOMHx3ZU8rV8UZHYUeufJQp6Oj-OcHKKrv_Lfh0bya2m_8vMhfE_Zw4_dE1LF-IMaXNkQj6-BxFzpT2gcSQLGobl3P2oR0jdQLDo7tsyS2G6tSRZqBXr7B_VJsJNJNwd__iYrBpOM-bfgab5eAwLM5f8wpsFWUAC8sUmAfgeAXeHk1GwywhqCHlncip6sKosKMf8a3jhqJ_miFn9rqt-00Ij_M91gIZQifNN1ohpvLpiht-pijviYD2WUHkB1D-A8CUD12P9uXs");'></div>
<div class="p-2">
<h3 class="text-lg font-bold">Client Communication</h3>
<p class="text-sm text-[var(--text-secondary)]">Communicate with clients via text, email, and push notifications.</p>
</div>
</div>
<div class="flex flex-col gap-4">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg shadow-md overflow-hidden" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCnLFvuvPgxnh7rYAULlHXLHP3WV8VGlH11XW8gzb20gl5Qu9LF3c_0bh7UyEZL4fGttqRNdWx1zoZw2pAzeLli-ibwJBcDuTIJHO6mkUM3nO2bmZXwevwD0qJxk7mmu491baC35YKwDhCMcqmCWjsYn-qv9ibD7wcfsRfmN0YQh4f9JLsIQmhmhTrZJZVe6LkxQt37zqIve5LJtqfLYWbdT2pBtHkLR59xxDWKMayquiJED14qoFgBH3pj7YQfjLjwa0K3txeZju8");'></div>
<div class="p-2">
<h3 class="text-lg font-bold">Marketing</h3>
<p class="text-sm text-[var(--text-secondary)]">Promote your business with email marketing, social media, and more.</p>
</div>
</div>
<div class="flex flex-col gap-4">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg shadow-md overflow-hidden" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBlvvpo3gq4hvf0u321b3WMUGMrbZQ5KWqJUSKxRB2VJDTCBk06PXCTy3cLK0j2_RUDp2QoWJWKRCbQaTYLHX6XPp1fgiZLq3S4kO3Tt0PkQ8rUlCfgbxPyN4oMzCibBoLBtCGgOVPLA5sxrlfWpWl0fYfV83BrzljgSxIHKt-ZLrOgoBmdg4qNODmEM3kxfhXk4TYDJXmGG68yXfX1NvyPp2Yj_nX30Vh95EmWGd_U2sjLJBeCROE-vz6MIhMK_QhSdYD6R_QAXew");'></div>
<div class="p-2">
<h3 class="text-lg font-bold">Reviews</h3>
<p class="text-sm text-[var(--text-secondary)]">Get more clients with positive reviews and testimonials.</p>
</div>
</div>
</div>
</section>
<section class="text-center" id="how-it-works" x-data="{ step: 1 }">
<h2 class="text-4xl font-bold mb-4">How it works</h2>
<p class="text-[var(--text-secondary)] max-w-3xl mx-auto mb-12">Get set up in just a few simple steps and start managing your salon like a pro.</p>
<div class="flex justify-center space-x-4 md:space-x-8 border-b">
<button :class="{'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]': step === 1, 'text-[var(--text-secondary)]': step !== 1}" @click="step = 1" class="pb-3 px-2 md:px-4 font-semibold transition-colors duration-300">Create salon profile</button>
<button :class="{'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]': step === 2, 'text-[var(--text-secondary)]': step !== 2}" @click="step = 2" class="pb-3 px-2 md:px-4 font-semibold transition-colors duration-300">Share booking link</button>
<button :class="{'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]': step === 3, 'text-[var(--text-secondary)]': step !== 3}" @click="step = 3" class="pb-3 px-2 md:px-4 font-semibold transition-colors duration-300">Receive bookings &amp; view stats</button>
</div>
<div class="mt-8">
<div class="flex justify-center" x-show="step === 1">
<img alt="Create Salon Profile" class="rounded-lg shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvnZ1wfk7mu3NjvtQoXL57M7YZjHN9_3e0Pql5GAHxLnknW9p-83L6NUTDH41cwI7MWXfyn24Zplip5xcQe8Qmazp4Ha4ld72TzJMDSJg8ZzUVS_cPsfXRdjnaTp19_MI8dacIDbKb5EhXuoKpKkwPFyALUEi__1hpfBwnyzFNKBFuV6Oj9_R5Q2R-CZ2ILI0M1ELtAewti4sc_zU4hA8rvUifv02BfuRJ_9i1pNDTSvcdfDE7F_2lbSfp5RaVlKUK6cggvdktsMI"/>
</div>
<div class="flex justify-center" x-show="step === 2">
<img alt="Share Booking Link" class="rounded-lg shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC87KPJ3aA-kAeYHZWoGrn2AHSIRFu5oSAYv3DJ7GR2kP06xSiINa8k3SLk2Z4hBYHuPgqxk_W-H1PyWFpBEQP5B-ESc7N-yOaOX17e8sc7-h4pHQDjqPOoTlFPXAOlQZTicT4Nl3KeY4fVtCTfEoj5n-smj1q-KDiMXCy_X5nOB0n_eUnExoCLWM_XdkCbXiBbrans_KpGD_qQxo8b8k-5qZwESQuMxWjpZl5mcC_xIck39oz2kQYRI4buYTaK8X0tqengO3Lf2Rc"/>
</div>
<div class="flex justify-center" x-show="step === 3">
<img alt="Receive Bookings &amp; View Stats" class="rounded-lg shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc0CrJ78UUzO8udM7mR16lkiUrVxKcHbwiKLQ46A5DmwgZmNhO4qAU28bLDyk4m374-MMpGXnDf2XzU8W1GQpzaSvMFCuTVkdq-AFtRTYAJ8h_bxZwvsdHgeTiv9BB7FAcBxDqGdREZwzN2vbwb-Jxad4yhsbBXu7Tb4xcldEn_aN52GYNCLeO-5unI2oyo5B2gevFRtp_OOggnPiF3sERRCR5ppXSgncKSFla81RYS-n_z6aTLlGI3wJs5Gvdthli3AJLh18Du4U"/>
</div>
</div>
<div class="relative w-full h-1 bg-gray-200 rounded-full mt-8 max-w-2xl mx-auto">
<div :style="`width: ${((step - 1) / 2) * 100}%`" class="absolute top-0 left-0 h-1 bg-[var(--primary-color)] rounded-full transition-all duration-500"></div>
</div>
</section>
<section class="text-center" id="widget">
<h2 class="text-3xl font-bold mb-2">Book in 30 seconds – try it now</h2>
<div class="w-full aspect-w-16 aspect-h-9 min-h-[420px] my-6">
<iframe allowfullscreen="" class="w-full h-full rounded-lg shadow-lg border" src="https://booksy.com/en-us/widget/light/12345#services" style="border:0;"></iframe>
</div>
<button class="button_secondary flex items-center gap-2 mx-auto" onclick="copyEmbedCode()">
<svg class="feather feather-copy" fill="none" height="20" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><rect height="13" rx="2" ry="2" width="13" x="9" y="9"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
<span>Copy embed code</span>
</button>
</section>
<section class="bg-white rounded-lg shadow-lg p-12" x-intersect.once="startCounters()">
<h2 class="text-4xl font-bold mb-4 text-center">Trusted by thousands of beauty salons</h2>
<div class="flex flex-wrap gap-8 justify-center mt-10">
<div class="flex min-w-[200px] flex-1 flex-col gap-2 rounded-lg p-6 bg-[var(--accent-color)] text-center">
<p class="text-4xl font-black leading-tight counter" data-target-str="1B+" x-ref="counter1">0</p>
<p class="text-lg font-medium">bookings</p>
</div>
<div class="flex min-w-[200px] flex-1 flex-col gap-2 rounded-lg p-6 bg-[var(--accent-color)] text-center">
<p class="text-4xl font-black leading-tight counter" data-target-str="130K+" x-ref="counter2">0</p>
<p class="text-lg font-medium">partners</p>
</div>
<div class="flex min-w-[200px] flex-1 flex-col gap-2 rounded-lg p-6 bg-[var(--accent-color)] text-center">
<p class="text-4xl font-black leading-tight counter" data-target-str="120+" x-ref="counter3">0</p>
<p class="text-lg font-medium">countries</p>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
<div class="bg-white p-6 rounded-lg border border-gray-200">
<div class="flex items-center gap-4 mb-4">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCiRpfbNJjhlD6xyqy3FY8AHcz4yDuIUYXuvkZxc_SWhL7q-fb3ym9omVOXd7EoqpSxxK9VS0nBu8gG6Kxm80DRvBuT3c5zfqUAVDD0YJAoLmppoT1Rn0xKYNsPHjXntOVbtfMbB2dO3M4_EGyeEG07lDTgEsUNsClXXqFiVRZ-feRSnrKgNu4k8gELRlnyUspbgkyXzx--jQS-dvdMR23nfZAjFqeURUDZFOl_ePe92fFwnqOsF_JyR7QCctp0idyUvbws8UVUNeM");'></div>
<div>
<p class="font-bold">Sophia Bennett</p>
<div class="flex gap-0.5 text-yellow-400">
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
</div>
</div>
</div>
<p class="text-[var(--text-secondary)] italic">"Beauty .DesignCorp has transformed my salon. The online booking and client management features have saved me so much time, and my clients love the convenience. I've seen a significant increase in bookings and revenue."</p>
</div>
<div class="bg-white p-6 rounded-lg border border-gray-200">
<div class="flex items-center gap-4 mb-4">
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBCDJ6H8LsGobPgNMnGXqwj5j-mPsw6T2ROgwhM30-xHjJQu1vlzdCHdF1KhOAqhNI6vVjLTxjwN7_DUlgXHk_uZ8iUKB81jLtVBCo325-LM-Ti8nNZSqnW1hSnEuKTcV3xEit1xGeU9qDjYf0wJxLK8uNp8ZVeKI08E6_w-hzR2hgClJmYoc0bq8oCGFpGAcCmEa4DMkft0nLfWppnmx1ATnvZbHHgmcomHAmBQKfUL9JO-Q5t3YklIB30N2Z2qlDMa9B_10g1Myg");'></div>
<div>
<p class="font-bold">Olivia Carter</p>
<div class="flex gap-0.5 text-yellow-400">
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
<svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34L66.61,153.8,21.5,114.38a16,16,0,0,1,9.11-28.06l59.46-5.15,23.21-55.36a15.95,15.95,0,0,1,29.44,0h0L166,81.17l59.44,5.15a16,16,0,0,1,9.11,28.06Z"></path></svg>
</div>
</div>
</div>
<p class="text-[var(--text-secondary)] italic">"I highly recommend Beauty .DesignCorp. The platform is user-friendly, and the support team is always responsive. It's been a game-changer for my salon, streamlining operations and boosting business."</p>
</div>
</div>
</section>
<section class="text-center" id="pricing">
<h2 class="text-4xl font-bold mb-4">Choose the perfect plan for you</h2>
<p class="text-[var(--text-secondary)] max-w-3xl mx-auto">Flexible pricing options designed to fit the needs of your salon, whether you're just starting out or looking to expand.</p>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
<div class="flex flex-col gap-4 rounded-lg border border-solid border-gray-200 bg-white p-8 shadow-md hover:shadow-xl transition-shadow">
<h3 class="text-2xl font-bold">Basic</h3>
<p class="flex items-baseline gap-1">
<span class="text-5xl font-black tracking-tight">$29</span>
<span class="text-lg font-bold">/month</span>
</p>
<button class="button_secondary w-full">Get started</button>
<ul class="flex flex-col gap-3 text-left mt-4">
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Online booking</li>
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Client management</li>
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Payments</li>
</ul>
</div>
<div class="flex flex-col gap-4 rounded-lg border-2 border-solid border-[var(--primary-color)] bg-white p-8 shadow-lg relative">
<div class="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-[var(--primary-color)] text-white px-3 py-1 text-sm font-bold rounded-full">Most Popular</div>
<h3 class="text-2xl font-bold">Pro</h3>
<p class="flex items-baseline gap-1">
<span class="text-5xl font-black tracking-tight">$49</span>
<span class="text-lg font-bold">/month</span>
</p>
<button class="button_primary w-full">Get started</button>
<ul class="flex flex-col gap-3 text-left mt-4">
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Everything in Basic</li>
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Marketing tools</li>
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Review management</li>
</ul>
</div>
<div class="flex flex-col gap-4 rounded-lg border border-solid border-gray-200 bg-white p-8 shadow-md hover:shadow-xl transition-shadow">
<h3 class="text-2xl font-bold">Premium</h3>
<p class="flex items-baseline gap-1">
<span class="text-5xl font-black tracking-tight">$99</span>
<span class="text-lg font-bold">/month</span>
</p>
<button class="button_secondary w-full">Get started</button>
<ul class="flex flex-col gap-3 text-left mt-4">
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Everything in Pro</li>
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Packages &amp; Memberships</li>
<li class="flex items-center gap-3"><svg class="text-green-500" fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>Gift cards</li>
</ul>
</div>
</div>
</section>
<section class="max-w-4xl mx-auto" id="faq">
<h2 class="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
<div class="bg-white rounded-lg shadow-lg">
<div class="accordion-item">
<label class="accordion-header" for="faq1">
<h3 class="font-semibold text-lg">What is Beauty .DesignCorp?</h3>
<svg class="w-6 h-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</label>
<input class="hidden" id="faq1" name="faq" type="radio"/>
<div class="accordion-content">
<p class="text-[var(--text-secondary)]">Beauty .DesignCorp is an all-in-one software platform designed specifically for beauty salons. It helps you manage online bookings, client relationships, payments, and marketing, all from one place.</p>
</div>
</div>
<div class="accordion-item">
<label class="accordion-header" for="faq2">
<h3 class="font-semibold text-lg">Can I try it before I buy?</h3>
<svg class="w-6 h-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</label>
<input class="hidden" id="faq2" name="faq" type="radio"/>
<div class="accordion-content">
<p class="text-[var(--text-secondary)]">Yes! We offer a free trial so you can experience the full power of Beauty .DesignCorp. No credit card is required to get started.</p>
</div>
</div>
<div class="accordion-item">
<label class="accordion-header" for="faq3">
<h3 class="font-semibold text-lg">Is it easy to set up?</h3>
<svg class="w-6 h-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</label>
<input class="hidden" id="faq3" name="faq" type="radio"/>
<div class="accordion-content">
<p class="text-[var(--text-secondary)]">Absolutely. Our platform is designed to be intuitive and user-friendly. You can set up your salon profile and start accepting bookings in minutes. Plus, our support team is always here to help.</p>
</div>
</div>
<div class="accordion-item">
<label class="accordion-header" for="faq4">
<h3 class="font-semibold text-lg">What kind of support do you offer?</h3>
<svg class="w-6 h-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</label>
<input class="hidden" id="faq4" name="faq" type="radio"/>
<div class="accordion-content">
<p class="text-[var(--text-secondary)]">We provide comprehensive support through our knowledge base, email, and live chat. Our Premium plan also includes a dedicated account manager.</p>
</div>
</div>
<div class="accordion-item">
<label class="accordion-header" for="faq5">
<h3 class="font-semibold text-lg">Can I integrate it with my existing website?</h3>
<svg class="w-6 h-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</label>
<input class="hidden" id="faq5" name="faq" type="radio"/>
<div class="accordion-content">
<p class="text-[var(--text-secondary)]">Yes, you can easily embed our booking widget directly into your website. It's fully customizable to match your brand's look and feel.</p>
</div>
</div>
<div class="accordion-item">
<label class="accordion-header" for="faq6">
<h3 class="font-semibold text-lg">Do I have to sign a long-term contract?</h3>
<svg class="w-6 h-6 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</label>
<input class="hidden" id="faq6" name="faq" type="radio"/>
<div class="accordion-content">
<p class="text-[var(--text-secondary)]">No. We offer flexible monthly plans that you can cancel or change at any time. We believe in earning your business every month.</p>
</div>
</div>
</div>
</section>
<section class="text-center bg-white rounded-lg shadow-lg p-12">
<h2 class="text-4xl font-bold mb-4">Ready to take your beauty salon to the next level?</h2>
<p class="text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">Join thousands of successful salon owners and start growing your business with Beauty .DesignCorp today.</p>
<button class="button_primary h-12 px-8 text-lg">Get started now</button>
</section>
<section class="text-center" id="blog">
<h2 class="text-4xl font-bold mb-4">From our Blog</h2>
<p class="text-[var(--text-secondary)] max-w-3xl mx-auto mb-12">Get the latest tips and insights for salon owners.</p>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<a class="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group" href="#" target="_blank">
<div class="w-full h-48 bg-gray-200">
<img alt="Blog Post 1" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD03CD6M1q7pFCTGzaQrXlpu2x2k7DqvCQNXclDKvM_NtHN3XaChQGwaxKdXgkJ_-QHWo9NSJ-vE24NXd1D0woMnel3Y66hSNy62136FBQXD8qUqfAjG93k5s-gufkAQ-yUohatdlV0n99xMYnXaY4g-S9iRnB84idt0LCh9_wFtp5104jts9blKTv0cBEKS2DjbjNyEqmHE0l7sSKkHFVp1LTtOXAX5wsJZEiduzzCcFawnomeHhDwi5f1hV_mkD9esCczhLGltnA"/>
</div>
<div class="p-6 text-left">
<span class="inline-block bg-red-100 text-[var(--primary-color)] text-xs font-semibold px-2 py-1 rounded-full mb-2">Marketing</span>
<h3 class="text-lg font-bold mb-2 group-hover:text-[var(--primary-color)] transition-colors">5 Marketing Ideas for Small Salons</h3>
<p class="text-sm text-[var(--text-secondary)]">5 min read</p>
</div>
</a>
<a class="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group" href="#" target="_blank">
<div class="w-full h-48 bg-gray-200">
<img alt="Blog Post 2" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyEgYv92cvR8Ay_Cvs2MYsi-Fys6wBXaLJWvZHXwh4kW3wXfjY4jhrEdNo5L56Ii4lkCnQD1TTWankgoRB1W1jzzy_CYFAts8vuQy4fVbzRuyRDlyhg0-UytLrSOONziUEHIbG_rGxr-_aWlYKaXgT_JeXYeec87AUXOm95oPA9wi6LvoDOM1ukelMsmrSf5PVWA7jqxlp3TTH2f-bFtDjnwLB9eJp3SkHpQxz9n4ETPbq4-lpXftutsDhuxhD0u9An3tGgk0ngMc"/>
</div>
<div class="p-6 text-left">
<span class="inline-block bg-gray-200 text-[var(--text-secondary)] text-xs font-semibold px-2 py-1 rounded-full mb-2">Business</span>
<h3 class="text-lg font-bold mb-2 group-hover:text-[var(--primary-color)] transition-colors">How to Increase Client Retention Rate</h3>
<p class="text-sm text-[var(--text-secondary)]">7 min read</p>
</div>
</a>
<a class="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group" href="#" target="_blank">
<div class="w-full h-48 bg-gray-200">
<img alt="Blog Post 3" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1UqVoA3nxkOyiqmPtfjW6trFVmMUXN5CIYifktTRYME0uO7MefH1Ib0ppYmVIf5tuqnPGtZa1kHOlWFeKPAmd6oofx_O-cXs9ATa76E0PBuftES3NcCDoQNQn4zqcgjK0msoKunSbrNOhKoZKLFfGDSGUmrhzB5-ILtcyzlpzd-RwKyr0twPwSetMy9h7AW6eV3qC-laP3eLEC8o9Cu5TaIJX6Sqf7HAHKkhUe0TsXUTeGwS_bNXnrk0vcykalgReGSAwxHBsao0"/>
</div>
<div class="p-6 text-left">
<span class="inline-block bg-red-100 text-[var(--primary-color)] text-xs font-semibold px-2 py-1 rounded-full mb-2">Trends</span>
<h3 class="text-lg font-bold mb-2 group-hover:text-[var(--primary-color)] transition-colors">Top Beauty Trends to Watch in 2024</h3>
<p class="text-sm text-[var(--text-secondary)]">6 min read</p>
</div>
</a>
</div>
</section>
</div>
</div>
</main>
<footer class="bg-white border-t border-gray-200">
<div class="container mx-auto px-4 py-8">
<div class="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
<div class="flex items-center gap-4">
<div class="w-6 h-6 text-[var(--primary-color)]">
<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path clip-rule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill="currentColor" fill-rule="evenodd"></path>
</svg>
</div>
<h2 class="text-lg font-bold">Beauty .DesignCorp</h2>
</div>
<nav class="flex flex-wrap justify-center gap-6">
<a class="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#">Knowledge Base</a>
<a class="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#blog">Blog</a>
<a class="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#faq">FAQ</a>
<a class="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#">Legal</a>
<a class="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#">Contact</a>
</nav>
<div class="flex justify-center gap-4">
<a class="text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#">
<svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg"><path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path></svg>
</a>
<a class="text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#">
<svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path></svg>
</a>
<a class="text-[var(--text-secondary)] hover:text-[var(--primary-color)]" href="#">
<svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"></path></svg>
</a>
</div>
</div>
<div class="text-center text-sm text-[var(--text-secondary)] mt-8 pt-8 border-t border-gray-200">
            © 2024 Beauty .DesignCorp. All rights reserved.
          </div>
</div>
</footer>
</div>
</div>
<script defer="" src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script>
    function copyEmbedCode() {
        const embedCode = '<iframe src="https://booksy.com/en-us/widget/light/12345#services" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>';
        navigator.clipboard.writeText(embedCode).then(() => {
            alert('Embed code copied to clipboard!');
        });
    }
    document.addEventListener('alpine:init', () => {
        Alpine.directive('intersect', (el, { value, expression, modifiers }, { evaluateLater, cleanup }) => {
            let observer = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            evaluateLater(expression)();
                            if (modifiers.includes('once')) {
                                observer.disconnect();
                            }
                        }
                    });
                }, { threshold: 0.1 }
            );
            observer.observe(el);
            cleanup(() => {
                observer.disconnect();
            });
        });
    });
    function startCounters() {
        const counters = document.querySelectorAll('.counter');
        const duration = 1300; // 1.3 seconds
        const animateCounter = (counter) => {
            const targetStr = counter.dataset.targetStr;
            const suffix = targetStr.replace(/[0-9.,]/g, '');
            const target = +targetStr.replace(/[^0-9.]/g, '');
            let start = 0;
            const startTime = Date.now();
            const updateCount = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                const currentValue = Math.floor(progress * target);
                let displayValue;
                if (targetStr.includes('B')) {
                    displayValue = (currentValue / 1000).toFixed(1).replace('.0', '') + 'B+';
                } else if (targetStr.includes('K')) {
                     displayValue = currentValue + 'K+';
                } else {
                     displayValue = currentValue + '+';
                }
                if (progress < 1) {
                    counter.innerText = Math.floor(currentValue).toLocaleString() + (target > 1000000 ? 'M+' : (target > 1000 ? 'K+' : '+'));
                     if (targetStr.includes('1B+')) counter.innerText = (currentValue / 1000).toFixed(2).replace('.00','') + 'B+';
                     else if (targetStr.includes('130K+')) counter.innerText = currentValue + 'K+';
                     else counter.innerText = currentValue + '+';
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = targetStr;
                }
            };
            requestAnimationFrame(updateCount);
        };
        counters.forEach(animateCounter);
    }
</script>

</body></html>