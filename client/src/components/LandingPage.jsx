import React from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaPalette, FaDownload, FaShare, FaChartLine, FaStar } from 'react-icons/fa';

const LandingPage = ({ onGetStarted }) => {
  const features = [
    {
      icon: <FaRocket className="w-8 h-8" />,
      title: "Quick Setup",
      description: "Create your professional portfolio in minutes with our intuitive wizard"
    },
    {
      icon: <FaPalette className="w-8 h-8" />,
      title: "Beautiful Templates",
      description: "Choose from multiple professionally designed templates"
    },
    {
      icon: <FaDownload className="w-8 h-8" />,
      title: "Export to PDF",
      description: "Download your portfolio as a polished PDF ready to share"
    },
    {
      icon: <FaShare className="w-8 h-8" />,
      title: "Share Online",
      description: "Get a unique public link to showcase your work anywhere"
    },
    {
      icon: <FaChartLine className="w-8 h-8" />,
      title: "Track Analytics",
      description: "See how many people view and download your portfolio"
    },
    {
      icon: <FaStar className="w-8 h-8" />,
      title: "Dark Mode",
      description: "Customize themes with dark mode and accent colors"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      text: "This portfolio builder helped me land my dream job! The templates are stunning and professional.",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "Data Scientist",
      text: "Super easy to use and the PDF export quality is amazing. Highly recommended!",
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer",
      text: "I love the customization options. My portfolio looks exactly how I envisioned it.",
      avatar: "ER"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 pt-20 pb-16"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Professional Portfolios Instantly
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Build stunning, ATS-friendly portfolios in minutes. No design skills required.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Get Started Free
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg font-semibold text-lg border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Sample Preview */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl shadow-2xl overflow-hidden border-4 border-white dark:border-gray-700">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 h-2"></div>
            <div className="bg-white dark:bg-gray-800 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  JD
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">John Doe</h3>
                  <p className="text-gray-600 dark:text-gray-400">Full Stack Developer</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Experience</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">5+ Years</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Projects</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">20+ Completed</p>
                </div>
                <div className="p-4 bg-pink-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Skills</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">15+ Technologies</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful features to showcase your skills and experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
              Loved by Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users have to say
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.text}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 w-4 h-4" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-white">
              Ready to Build Your Portfolio?
            </h2>
            <p className="text-xl text-white mb-8 opacity-90">
              Join thousands of professionals who've created stunning portfolios
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Get Started Now - It's Free!
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-gray-900 text-gray-400 text-center">
        <p>&copy; 2026 Portfolio Generator. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LandingPage;
