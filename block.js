document.addEventListener('DOMContentLoaded', () => {
    const leetcodeLink = document.getElementById('leetcode-link');
    const urlParams = new URLSearchParams(window.location.search);
    const problemUrl = urlParams.get('problemUrl');

    if (problemUrl) {
        leetcodeLink.href = problemUrl;
    }
});