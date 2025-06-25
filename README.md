# Alt Caption Generator

Alt Caption Generator is a tool designed to help create accessible alternative text for images. The application uses AI to generate descriptive captions that can be used as alt text for images on websites, making content more accessible to users with visual impairments.

## Features

- AI-powered image description generation
- Simple and intuitive user interface
- Customizable caption options
- Copy-to-clipboard functionality
- Responsive design for use on various devices

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/chad-f-dalrymple/alt-caption-generator.git
cd alt-caption-generator
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   
   Create a `.env` file in the root directory and add your API keys:

```
HUGGINGFACE_API_TOKEN=your_hugginface_api_key_here
```

4. Start the development server. This runs back end and front end concurrently:

```bash
npm run dev
```

This command runs the frontend and backend concurrently.

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Upload an image using the file uploader
2. Wait for the AI to process the image and generate a caption
3. Review and edit the generated caption if needed
4. Copy the caption to use as alt text in your projects

## Tech Stack

- Frontend: React.js
- Styling: CSS/SCSS
- AI Integration: Huggingface API
- Build Tool: Vite

## Accessibility

This project aims to improve web accessibility by helping developers create better alt text for images. We've ensured that the tool itself is also accessible by:

- Using semantic HTML
- Ensuring proper contrast ratios
- Supporting keyboard navigation
- Including ARIA attributes where necessary

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for their powerful image recognition API
- The web accessibility community for inspiration
- All contributors who have helped improve this tool

## Contact

Chad Dalrymple - [@chad_f_dalrymple](https://twitter.com/chad_f_dalrymple)

Project Link: [https://github.com/chad-f-dalrymple/alt-caption-generator](https://github.com/chad-f-dalrymple/alt-caption-generator)
