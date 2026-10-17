import Box, { type BoxProps } from '@mui/material/Box';

interface IconProps extends Omit<BoxProps<'i'>, 'children'> {
  /** Line Awesome icon name without the `la-` prefix, e.g. "route". */
  name: string;
  size?: number | string;
}

/** Line Awesome icon (https://icons8.com/line-awesome). */
export function Icon({ name, size = 22, className, sx, ...rest }: IconProps) {
  return (
    <Box
      component="i"
      aria-hidden
      className={['las', `la-${name}`, className].filter(Boolean).join(' ')}
      sx={[
        { fontSize: size, lineHeight: 1, display: 'inline-flex' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
}
