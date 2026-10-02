import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { resetReported } from 'util/errorReporter';

function Broken() {
  throw new TypeError('names is undefined');
}

beforeEach(() => {
  resetReported();
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

it('shows a way out instead of a blank page, and reports the error', () => {
  render(<ErrorBoundary><Broken /></ErrorBoundary>);
  expect(screen.getByRole('alert')).toHaveTextContent('Có lỗi xảy ra');
  expect(screen.getByRole('button', { name: 'Tải lại trang' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).message).toBe('names is undefined');
});

it('renders the page when nothing breaks', () => {
  render(<ErrorBoundary><p>Thiệp mời</p></ErrorBoundary>);
  expect(screen.getByText('Thiệp mời')).toBeInTheDocument();
});
