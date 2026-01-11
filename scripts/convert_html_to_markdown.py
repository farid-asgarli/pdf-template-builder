#!/usr/bin/env python3
"""
Convert QuestPDF HTML documentation to AI-friendly Markdown format.

This script processes VitePress-generated HTML documentation files and converts
them to clean, readable Markdown suitable for AI agents.

Usage:
    python convert_html_to_markdown.py [--input-dir PATH] [--output-dir PATH]
"""

import os
import re
import html
import argparse
from pathlib import Path
from typing import Optional


class HtmlToMarkdownConverter:
    """Converts QuestPDF HTML documentation to Markdown format."""

    def __init__(self):
        self.current_file = ""

    def convert_file(self, html_content: str, filename: str) -> str:
        """Convert a single HTML file to Markdown."""
        self.current_file = filename
        
        # Extract the main content
        content = self._extract_main_content(html_content)
        
        # Process in order (order matters for nested elements)
        content = self._remove_hidden_elements(content)
        content = self._convert_code_blocks(content)
        content = self._convert_inline_code(content)
        content = self._convert_headers(content)
        content = self._convert_custom_blocks(content)
        content = self._convert_tables(content)
        content = self._convert_images(content)
        content = self._convert_links(content)
        content = self._convert_lists(content)
        content = self._convert_paragraphs(content)
        content = self._convert_text_formatting(content)
        content = self._clean_html_entities(content)
        content = self._cleanup_whitespace(content)
        
        # Add title from filename
        title = self._generate_title(filename)
        return f"# {title}\n\n{content}"

    def _extract_main_content(self, html_content: str) -> str:
        """Extract the main documentation content from the HTML."""
        # Try to find the main content div
        main_match = re.search(r'<main[^>]*>(.*?)</main>', html_content, re.DOTALL)
        if main_match:
            return main_match.group(1)
        
        # Fallback to body content
        body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL)
        if body_match:
            return body_match.group(1)
        
        return html_content

    def _remove_hidden_elements(self, content: str) -> str:
        """Remove hidden elements (like LLM hints that are already hidden)."""
        # Remove divs with aria-hidden="true" or hidden="true"
        content = re.sub(
            r'<div[^>]*(?:aria-hidden="true"|hidden="true")[^>]*>.*?</div>',
            '',
            content,
            flags=re.DOTALL | re.IGNORECASE
        )
        # Remove copy buttons
        content = re.sub(r'<button[^>]*class="copy"[^>]*>.*?</button>', '', content, flags=re.DOTALL)
        # Remove header anchor links
        content = re.sub(r'<a[^>]*class="header-anchor"[^>]*>.*?</a>', '', content, flags=re.DOTALL)
        return content

    def _convert_code_blocks(self, content: str) -> str:
        """Convert syntax-highlighted code blocks to markdown code blocks."""
        
        def extract_text_from_spans(html_content: str) -> str:
            """Recursively extract text from nested span elements."""
            # This handles the Shiki syntax highlighter's nested span structure
            # where code is split into spans with style attributes
            
            result = []
            # Use a simple state machine to extract text between tags
            i = 0
            while i < len(html_content):
                if html_content[i] == '<':
                    # Find the end of the tag
                    end = html_content.find('>', i)
                    if end == -1:
                        break
                    i = end + 1
                else:
                    # Find the start of the next tag or end of string
                    next_tag = html_content.find('<', i)
                    if next_tag == -1:
                        result.append(html_content[i:])
                        break
                    else:
                        result.append(html_content[i:next_tag])
                        i = next_tag
            
            return ''.join(result)
        
        def extract_code_from_pre(match):
            """Extract plain text code from a pre/code block with syntax highlighting."""
            full_block = match.group(0)
            
            # Get language from the outer div or span
            lang_match = re.search(r'class="language-([^"\s]+)', full_block)
            language = lang_match.group(1) if lang_match else ''
            
            # Also try to find language from span.lang
            if not language:
                span_lang = re.search(r'<span class="lang">([^<]+)</span>', full_block)
                if span_lang:
                    language = span_lang.group(1)
            
            # Find the code element
            code_match = re.search(r'<code[^>]*>(.*?)</code>', full_block, re.DOTALL)
            if not code_match:
                return full_block
            
            code_content = code_match.group(1)
            
            # Extract text from span.line elements (handles highlighted lines too)
            # Match both 'class="line"' and 'class="line highlighted"' etc.
            lines = re.findall(r'<span class="line[^"]*"[^>]*>(.*?)</span>(?=\s*<span class="line|$)', 
                             code_content, re.DOTALL)
            
            if lines:
                clean_lines = []
                for line in lines:
                    # Extract all text from nested spans
                    clean_line = extract_text_from_spans(line)
                    clean_line = html.unescape(clean_line)
                    clean_lines.append(clean_line)
                code_text = '\n'.join(clean_lines)
            else:
                # Alternative approach: find all line spans differently
                # Split by line span opening tags
                line_parts = re.split(r'<span class="line[^"]*"[^>]*>', code_content)
                if len(line_parts) > 1:
                    clean_lines = []
                    for part in line_parts[1:]:  # Skip first empty part
                        # Take content up to closing span
                        end_idx = part.rfind('</span>')
                        if end_idx > 0:
                            line_content = part[:end_idx]
                        else:
                            line_content = part
                        clean_line = extract_text_from_spans(line_content)
                        clean_line = html.unescape(clean_line)
                        clean_lines.append(clean_line)
                    code_text = '\n'.join(clean_lines)
                else:
                    # Fallback: just strip all tags
                    code_text = re.sub(r'<[^>]+>', '', code_content)
                    code_text = html.unescape(code_text)
            
            return f"\n```{language}\n{code_text.strip()}\n```\n"
        
        # Match the entire code block container
        content = re.sub(
            r'<div class="language-[^"]*[^>]*>.*?<pre[^>]*>.*?</pre>\s*</div>',
            extract_code_from_pre,
            content,
            flags=re.DOTALL
        )
        
        # Also handle standalone pre/code blocks
        content = re.sub(
            r'<pre[^>]*>\s*<code[^>]*>(.*?)</code>\s*</pre>',
            lambda m: f"\n```\n{html.unescape(re.sub(r'<[^>]+>', '', m.group(1)))}\n```\n",
            content,
            flags=re.DOTALL
        )
        
        return content

    def _convert_inline_code(self, content: str) -> str:
        """Convert inline code elements to markdown."""
        def convert_code(match):
            code_text = match.group(1)
            code_text = re.sub(r'<[^>]+>', '', code_text)
            code_text = html.unescape(code_text)
            return f"`{code_text}`"
        
        content = re.sub(r'<code[^>]*>(.*?)</code>', convert_code, content, flags=re.DOTALL)
        return content

    def _convert_headers(self, content: str) -> str:
        """Convert HTML headers to markdown headers."""
        def convert_header(match):
            level = int(match.group(1))
            # Skip h1 as we'll add our own title
            if level == 1:
                return ''
            
            header_content = match.group(2)
            # Clean up the header content
            header_text = re.sub(r'<[^>]+>', '', header_content)
            header_text = html.unescape(header_text).strip()
            # Remove the anchor symbol (​)
            header_text = header_text.replace('​', '').strip()
            
            if not header_text:
                return ''
            
            return f"\n{'#' * level} {header_text}\n"
        
        content = re.sub(
            r'<h([1-6])[^>]*>(.*?)</h\1>',
            convert_header,
            content,
            flags=re.DOTALL
        )
        return content

    def _convert_custom_blocks(self, content: str) -> str:
        """Convert VitePress custom blocks (warning, info, tip, etc.) to markdown."""
        def convert_block(match):
            full_block = match.group(0)
            
            # Determine block type
            if 'warning' in full_block.lower():
                block_type = 'WARNING'
            elif 'danger' in full_block.lower():
                block_type = 'DANGER'
            elif 'tip' in full_block.lower():
                block_type = 'TIP'
            elif 'info' in full_block.lower():
                block_type = 'INFO'
            else:
                block_type = 'NOTE'
            
            # Extract content (after the title)
            # Remove the title paragraph
            block_content = re.sub(r'<p[^>]*class="custom-block-title"[^>]*>.*?</p>', '', full_block, flags=re.DOTALL)
            # Extract remaining paragraph content
            paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', block_content, re.DOTALL)
            text_content = ' '.join(paragraphs)
            
            # Convert links within the block before stripping other tags
            def convert_inner_link(link_match):
                href = re.search(r'href="([^"]+)"', link_match.group(0))
                link_text = re.sub(r'<[^>]+>', '', link_match.group(1))
                if href:
                    return f"[{link_text}]({href.group(1)})"
                return link_text
            
            text_content = re.sub(r'<a[^>]*>(.*?)</a>', convert_inner_link, text_content, flags=re.DOTALL)
            
            # Now strip remaining tags
            text_content = re.sub(r'<[^>]+>', '', text_content)
            text_content = html.unescape(text_content).strip()
            
            return f"\n> **{block_type}:** {text_content}\n"
        
        content = re.sub(
            r'<div class="[^"]*custom-block[^"]*"[^>]*>.*?</div>',
            convert_block,
            content,
            flags=re.DOTALL
        )
        return content

    def _convert_tables(self, content: str) -> str:
        """Convert HTML tables to markdown tables."""
        def convert_table(match):
            table_html = match.group(0)
            
            # Extract headers
            headers = []
            header_match = re.search(r'<thead>(.*?)</thead>', table_html, re.DOTALL)
            if header_match:
                header_cells = re.findall(r'<th[^>]*>(.*?)</th>', header_match.group(1), re.DOTALL)
                headers = [html.unescape(re.sub(r'<[^>]+>', '', h)).strip() for h in header_cells]
            
            # Extract rows
            rows = []
            body_match = re.search(r'<tbody>(.*?)</tbody>', table_html, re.DOTALL)
            if body_match:
                row_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', body_match.group(1), re.DOTALL)
                for row in row_matches:
                    cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
                    rows.append([html.unescape(re.sub(r'<[^>]+>', '', c)).strip() for c in cells])
            
            if not headers and not rows:
                return ''
            
            # Build markdown table
            md_lines = []
            
            if headers:
                md_lines.append('| ' + ' | '.join(headers) + ' |')
                md_lines.append('| ' + ' | '.join(['---'] * len(headers)) + ' |')
            
            for row in rows:
                # Pad row if needed
                while len(row) < len(headers):
                    row.append('')
                md_lines.append('| ' + ' | '.join(row) + ' |')
            
            return '\n' + '\n'.join(md_lines) + '\n'
        
        content = re.sub(r'<table[^>]*>.*?</table>', convert_table, content, flags=re.DOTALL)
        return content

    def _convert_images(self, content: str) -> str:
        """Convert image tags to markdown image syntax."""
        def convert_image(match):
            img_tag = match.group(0)
            
            # Extract src
            src_match = re.search(r'src="([^"]+)"', img_tag)
            src = src_match.group(1) if src_match else ''
            
            # Extract alt
            alt_match = re.search(r'alt="([^"]*)"', img_tag)
            alt = alt_match.group(1) if alt_match else 'image'
            
            if not src:
                return ''
            
            return f"\n![{alt}]({src})\n"
        
        content = re.sub(r'<img[^>]+/?>', convert_image, content, flags=re.IGNORECASE)
        return content

    def _convert_links(self, content: str) -> str:
        """Convert anchor tags to markdown links."""
        def convert_link(match):
            full_tag = match.group(0)
            link_text = match.group(2)
            
            # Extract href
            href_match = re.search(r'href="([^"]+)"', full_tag)
            href = href_match.group(1) if href_match else ''
            
            # Clean link text
            link_text = re.sub(r'<[^>]+>', '', link_text)
            link_text = html.unescape(link_text).strip()
            
            if not link_text or not href:
                return link_text if link_text else ''
            
            # Skip anchor-only links
            if href.startswith('#'):
                return link_text
            
            return f"[{link_text}]({href})"
        
        content = re.sub(r'<a([^>]*)>(.*?)</a>', convert_link, content, flags=re.DOTALL)
        return content

    def _convert_lists(self, content: str) -> str:
        """Convert HTML lists to markdown lists."""
        # Convert unordered lists
        def convert_ul(match):
            list_content = match.group(1)
            items = re.findall(r'<li[^>]*>(.*?)</li>', list_content, re.DOTALL)
            md_items = []
            for item in items:
                item_text = re.sub(r'<[^>]+>', '', item)
                item_text = html.unescape(item_text).strip()
                md_items.append(f"- {item_text}")
            return '\n' + '\n'.join(md_items) + '\n'
        
        content = re.sub(r'<ul[^>]*>(.*?)</ul>', convert_ul, content, flags=re.DOTALL)
        
        # Convert ordered lists
        def convert_ol(match):
            list_content = match.group(1)
            items = re.findall(r'<li[^>]*>(.*?)</li>', list_content, re.DOTALL)
            md_items = []
            for i, item in enumerate(items, 1):
                item_text = re.sub(r'<[^>]+>', '', item)
                item_text = html.unescape(item_text).strip()
                md_items.append(f"{i}. {item_text}")
            return '\n' + '\n'.join(md_items) + '\n'
        
        content = re.sub(r'<ol[^>]*>(.*?)</ol>', convert_ol, content, flags=re.DOTALL)
        return content

    def _convert_paragraphs(self, content: str) -> str:
        """Convert paragraph tags to text with proper spacing."""
        def convert_p(match):
            p_content = match.group(1)
            # Don't process if already processed (contains markdown)
            if '```' in p_content:
                return p_content
            
            text = re.sub(r'<[^>]+>', '', p_content)
            text = html.unescape(text).strip()
            if text:
                return f"\n{text}\n"
            return ''
        
        content = re.sub(r'<p[^>]*>(.*?)</p>', convert_p, content, flags=re.DOTALL)
        return content

    def _convert_text_formatting(self, content: str) -> str:
        """Convert HTML text formatting to markdown."""
        # Bold
        content = re.sub(r'<strong>(.*?)</strong>', r'**\1**', content, flags=re.DOTALL)
        content = re.sub(r'<b>(.*?)</b>', r'**\1**', content, flags=re.DOTALL)
        
        # Italic
        content = re.sub(r'<em>(.*?)</em>', r'*\1*', content, flags=re.DOTALL)
        content = re.sub(r'<i>(.*?)</i>', r'*\1*', content, flags=re.DOTALL)
        
        # Strikethrough
        content = re.sub(r'<del>(.*?)</del>', r'~~\1~~', content, flags=re.DOTALL)
        content = re.sub(r'<s>(.*?)</s>', r'~~\1~~', content, flags=re.DOTALL)
        
        return content

    def _clean_html_entities(self, content: str) -> str:
        """Clean up any remaining HTML entities."""
        content = html.unescape(content)
        # Remove common artifacts
        content = content.replace('​', '')  # Zero-width space
        content = content.replace('\u200b', '')  # Another zero-width space
        return content

    def _cleanup_whitespace(self, content: str) -> str:
        """Clean up excessive whitespace while preserving code blocks."""
        # Split content by code blocks to preserve their formatting
        parts = re.split(r'(```[\s\S]*?```)', content)
        
        cleaned_parts = []
        for i, part in enumerate(parts):
            if part.startswith('```'):
                # This is a code block, preserve it
                cleaned_parts.append(part)
            else:
                # Clean up whitespace in non-code parts
                # Remove remaining HTML tags
                part = re.sub(r'<[^>]+>', '', part)
                # Normalize multiple newlines to max 2
                part = re.sub(r'\n{3,}', '\n\n', part)
                # Remove leading/trailing whitespace from lines
                lines = [line.strip() for line in part.split('\n')]
                part = '\n'.join(lines)
                cleaned_parts.append(part)
        
        content = ''.join(cleaned_parts)
        
        # Final cleanup
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = content.strip()
        
        return content

    def _generate_title(self, filename: str) -> str:
        """Generate a readable title from the filename."""
        # Remove extension
        name = Path(filename).stem
        
        # Replace underscores and hyphens with spaces
        name = name.replace('_', ' ').replace('-', ' ')
        
        # Handle common patterns
        name = re.sub(r'^api reference ', 'API Reference: ', name, flags=re.IGNORECASE)
        
        # Title case
        words = name.split()
        title_words = []
        for word in words:
            if word.lower() in ['api', 'pdf', 'svg', 'html', 'css']:
                title_words.append(word.upper())
            else:
                title_words.append(word.capitalize())
        
        return ' '.join(title_words)


def convert_directory(input_dir: str, output_dir: str) -> None:
    """Convert all HTML files in a directory to Markdown."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    converter = HtmlToMarkdownConverter()
    
    # Find all HTML files
    html_files = list(input_path.glob('*.html'))
    
    print(f"Found {len(html_files)} HTML files to convert")
    
    for html_file in html_files:
        print(f"Converting: {html_file.name}")
        
        try:
            # Read HTML content
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Convert to Markdown
            markdown_content = converter.convert_file(html_content, html_file.name)
            
            # Write Markdown file
            md_filename = html_file.stem + '.md'
            output_file = output_path / md_filename
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            print(f"  -> Created: {md_filename}")
            
        except Exception as e:
            print(f"  Error converting {html_file.name}: {e}")
    
    print(f"\nConversion complete! Markdown files saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description='Convert QuestPDF HTML documentation to Markdown'
    )
    parser.add_argument(
        '--input-dir',
        default='../docs/questpdf',
        help='Input directory containing HTML files'
    )
    parser.add_argument(
        '--output-dir',
        default='../docs/questpdf-md',
        help='Output directory for Markdown files'
    )
    
    args = parser.parse_args()
    
    # Resolve paths relative to script location
    script_dir = Path(__file__).parent
    input_dir = (script_dir / args.input_dir).resolve()
    output_dir = (script_dir / args.output_dir).resolve()
    
    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")
    print()
    
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {input_dir}")
        return 1
    
    convert_directory(str(input_dir), str(output_dir))
    return 0


if __name__ == '__main__':
    exit(main())
